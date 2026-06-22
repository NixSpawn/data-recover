import asyncio
import os
import plistlib
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


def _run(cmd: list[str]) -> bytes:
    result = subprocess.run(cmd, capture_output=True, check=True)
    return result.stdout


def _diskutil_list() -> dict:
    raw = _run(["diskutil", "list", "-plist", "external"])
    return plistlib.loads(raw)


def _diskutil_info(identifier: str) -> dict:
    raw = _run(["diskutil", "info", "-plist", identifier])
    return plistlib.loads(raw)


def _build_disk(identifier: str, disk_type: DiskType) -> Disk | None:
    try:
        info = _diskutil_info(identifier)
        fs_raw = (info.get("FilesystemType") or info.get("Content") or "").lower()
        fs = _FILESYSTEM_MAP.get(fs_raw, FilesystemType.UNKNOWN)
        total = info.get("TotalSize") or info.get("Size") or 0
        used = info.get("VolumeUsedSpace") or 0
        mount = info.get("MountPoint") or None

        if total == 0:
            return None

        return Disk(
            id=identifier,
            name=info.get("VolumeName") or info.get("MediaName") or identifier,
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


class MacDiskScanner:
    async def list_disks(self) -> list[Disk]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._list_disks_sync)

    def _list_disks_sync(self) -> list[Disk]:
        disks: list[Disk] = []

        try:
            # Internal disks
            raw = _run(["diskutil", "list", "-plist"])
            plist = plistlib.loads(raw)

            for entry in plist.get("AllDisksAndPartitions", []):
                identifier = entry.get("DeviceIdentifier", "")

                disk_type = DiskType.EXTERNAL if "external" in str(entry).lower() else DiskType.INTERNAL

                # Top-level disk (physical)
                disk = _build_disk(identifier, disk_type)
                if disk:
                    disks.append(disk)

                # Partitions / volumes
                for partition in entry.get("Partitions", []):
                    pid = partition.get("DeviceIdentifier", "")
                    pdisk = _build_disk(pid, disk_type)
                    if pdisk:
                        disks.append(pdisk)

                # APFS volumes
                for volume in entry.get("APFSVolumes", []):
                    vid = volume.get("DeviceIdentifier", "")
                    vdisk = _build_disk(vid, disk_type)
                    if vdisk:
                        disks.append(vdisk)

        except Exception:
            pass

        return [d for d in disks if d is not None]

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
            except Exception as exc:
                pass
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, None)

        def _walk(fs, directory, path: str, disk: Disk, q, lp):
            for entry in directory:
                try:
                    name_bytes = entry.info.name.name
                    name = name_bytes.decode("utf-8", errors="replace")
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

        asyncio.get_event_loop().run_in_executor(None, _scan)

        while True:
            item = await queue.get()
            if item is None:
                break
            yield item
