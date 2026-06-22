import asyncio
import plistlib
import shutil
import subprocess
from typing import AsyncGenerator

import pytsk3

from ....core.domain.entities.deleted_file import DeletedFile
from ....core.domain.entities.disk import Disk, DiskType, FilesystemType

_FILESYSTEM_MAP: dict[str, FilesystemType] = {
    "apfs": FilesystemType.APFS,
    "hfs": FilesystemType.HFS_PLUS,
    "hfs+": FilesystemType.HFS_PLUS,
    "msdos": FilesystemType.FAT32,
    "exfat": FilesystemType.EXFAT,
    "ntfs": FilesystemType.NTFS,
}

# APFS system volumes that are never useful for file recovery
_SKIP_VOLUME_NAMES = {
    "preboot", "recovery", "vm", "update", "efi",
}

# Content/partition types to skip (physical container entries)
_SKIP_CONTENT_TYPES = {
    "efi", "apple_apfs", "apple_boot", "apple_recovery",
    "microsoft basic data",
}


def _run(cmd: list[str]) -> bytes:
    result = subprocess.run(cmd, capture_output=True, check=True)
    return result.stdout


def _diskutil_info(identifier: str) -> dict:
    raw = _run(["diskutil", "info", "-plist", identifier])
    return plistlib.loads(raw)


def _get_used_space(mount_point: str | None, info: dict) -> int:
    """Try multiple sources to get real used space."""
    # Best: ask the OS for the mounted volume usage
    if mount_point:
        try:
            usage = shutil.disk_usage(mount_point)
            return usage.used
        except Exception:
            pass

    # Fallback: APFS-specific keys in diskutil output
    for key in ("APFSVolumeUsedSpace", "VolumeUsedSpace", "CapacityInUse"):
        val = info.get(key)
        if val:
            return int(val)

    return 0


def _should_skip(info: dict) -> bool:
    name = (info.get("VolumeName") or "").lower()
    content = (info.get("Content") or info.get("FilesystemType") or "").lower()
    media_type = (info.get("MediaType") or "").lower()
    is_whole = info.get("WholeDisk", False)

    # Skip raw physical disks (disk0, disk1) — no filesystem
    if is_whole:
        return True

    # Skip known system-only APFS volume names
    if name in _SKIP_VOLUME_NAMES:
        return True

    # Skip EFI, APFS container, boot helper partitions
    if content in _SKIP_CONTENT_TYPES:
        return True

    # Skip disk images (used by macOS internally)
    if "disk image" in name or media_type == "disk image":
        return True

    # Skip iOS/simulator disk images that show up
    if "simulator" in name:
        return True

    # Skip the sealed system volume (read-only, no user files)
    # macOS Big Sur+: Macintosh HD is SystemImage=True, Data volume is not
    if info.get("SystemImage", False):
        return True

    # Skip APFS volumes with System role (sealed OS volume)
    role = (info.get("APFSVolumeRole") or "").lower()
    if role == "system":
        return True

    return False


def _build_disk(identifier: str, disk_type: DiskType) -> Disk | None:
    try:
        info = _diskutil_info(identifier)

        if _should_skip(info):
            return None

        fs_raw = (info.get("FilesystemType") or info.get("Content") or "").lower()
        fs = _FILESYSTEM_MAP.get(fs_raw, FilesystemType.UNKNOWN)

        total = info.get("TotalSize") or info.get("Size") or 0
        if total == 0:
            return None

        mount = info.get("MountPoint") or None
        used = _get_used_space(mount, info)

        # Prefer a human-readable name; fall back to identifier
        name = info.get("VolumeName") or info.get("MediaName") or identifier

        return Disk(
            id=identifier,
            name=name,
            device_path=f"/dev/{identifier}",
            total_size=total,
            used_size=used,
            filesystem=fs,
            disk_type=disk_type,
            mount_point=mount,
            label=info.get("VolumeName"),
            is_system=info.get("SystemImage", False),
        )
    except Exception:
        return None


def _is_duplicate(disk: Disk, seen: set[str]) -> bool:
    """Deduplicate by mount point — APFS sometimes exposes the same volume twice."""
    key = disk.mount_point or disk.device_path
    if key in seen:
        return True
    seen.add(key)
    return False


class MacDiskScanner:
    async def list_disks(self) -> list[Disk]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._list_disks_sync)

    def _list_disks_sync(self) -> list[Disk]:
        disks: list[Disk] = []
        seen_mounts: set[str] = set()

        try:
            raw = _run(["diskutil", "list", "-plist"])
            plist = plistlib.loads(raw)

            for entry in plist.get("AllDisksAndPartitions", []):
                is_external = entry.get("OSInternal", True) is False
                disk_type = DiskType.EXTERNAL if is_external else DiskType.INTERNAL

                # Partitions (non-APFS disks like HFS+, FAT32, exFAT)
                for partition in entry.get("Partitions", []):
                    pid = partition.get("DeviceIdentifier", "")
                    pdisk = _build_disk(pid, disk_type)
                    if pdisk and not _is_duplicate(pdisk, seen_mounts):
                        disks.append(pdisk)

                # APFS volumes inside containers
                for volume in entry.get("APFSVolumes", []):
                    vid = volume.get("DeviceIdentifier", "")
                    vdisk = _build_disk(vid, disk_type)
                    if vdisk and not _is_duplicate(vdisk, seen_mounts):
                        disks.append(vdisk)

        except Exception:
            pass

        return disks

    async def scan_deleted_files(
        self,
        disk: Disk,
        session_id: str,
    ) -> AsyncGenerator[DeletedFile, None]:
        loop = asyncio.get_event_loop()
        queue: asyncio.Queue[DeletedFile | None] = asyncio.Queue()

        def _scan():
            try:
                img = pytsk3.Img_Info(disk.device_path)
                fs = pytsk3.FS_Info(img)
                _walk(fs, fs.open_dir(path="/"), "/", disk, queue, loop)
            except Exception:
                pass
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, None)

        def _walk(fs, directory, path: str, disk: Disk, q, lp):
            for entry in directory:
                try:
                    name = entry.info.name.name.decode("utf-8", errors="replace")
                    if name in (".", ".."):
                        continue

                    meta = entry.info.meta
                    if meta is None:
                        continue

                    is_deleted = bool(meta.flags & pytsk3.TSK_FS_META_FLAG_UNALLOC)

                    if is_deleted:
                        ext = name.rsplit(".", 1)[-1] if "." in name else ""
                        df = DeletedFile(
                            inode=int(meta.addr),
                            name=name,
                            original_path=f"{path}/{name}",
                            size=int(meta.size),
                            filesystem=disk.filesystem.value,
                            disk_id=disk.id,
                            extension=ext,
                            is_recoverable=int(meta.size) > 0,
                        )
                        lp.call_soon_threadsafe(q.put_nowait, df)

                    if meta.type == pytsk3.TSK_FS_META_TYPE_DIR:
                        try:
                            sub = fs.open_dir(inode=int(meta.addr))
                            _walk(fs, sub, f"{path}/{name}", disk, q, lp)
                        except Exception:
                            pass

                except Exception:
                    continue

        loop.run_in_executor(None, _scan)

        while True:
            item = await queue.get()
            if item is None:
                break
            yield item
