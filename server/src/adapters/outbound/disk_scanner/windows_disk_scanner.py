import asyncio
import json
import subprocess
from typing import AsyncGenerator, Callable

import pytsk3

from ....core.domain.entities.deleted_file import DeletedFile
from ....core.domain.entities.disk import Disk, DiskType, FilesystemType

_FILESYSTEM_MAP: dict[str, FilesystemType] = {
    "ntfs": FilesystemType.NTFS,
    "fat32": FilesystemType.FAT32,
    "fat": FilesystemType.FAT32,
    "exfat": FilesystemType.EXFAT,
}

# Drive types from Win32_LogicalDisk / Get-Volume
_DRIVE_TYPE_REMOVABLE = {2, 5}  # 2=Removable, 5=CD-ROM


def _powershell(cmd: str) -> str:
    result = subprocess.run(
        ["powershell", "-NoProfile", "-Command", cmd],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


class WindowsDiskScanner:
    async def list_disks(self) -> list[Disk]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._list_disks_sync)

    def _list_disks_sync(self) -> list[Disk]:
        disks: list[Disk] = []
        try:
            raw = _powershell(
                "Get-Volume | Where-Object {$_.DriveLetter -ne $null -and $_.DriveType -ne 'CD-ROM'} | "
                "Select-Object DriveLetter, FileSystemLabel, FileSystem, SizeRemaining, Size, DriveType | "
                "ConvertTo-Json -Depth 3"
            )
            if not raw:
                return disks

            volumes = json.loads(raw)
            if isinstance(volumes, dict):
                volumes = [volumes]

            for vol in volumes:
                letter = (vol.get("DriveLetter") or "").strip()
                if not letter:
                    continue

                fs_raw = (vol.get("FileSystem") or "").lower()
                fs = _FILESYSTEM_MAP.get(fs_raw, FilesystemType.UNKNOWN)

                total = int(vol.get("Size") or 0)
                if total == 0:
                    continue

                free = int(vol.get("SizeRemaining") or 0)
                used = total - free

                drive_type = (vol.get("DriveType") or "").lower()
                disk_type = DiskType.REMOVABLE if "removable" in drive_type else DiskType.INTERNAL

                label = (vol.get("FileSystemLabel") or "").strip() or None
                name = label or f"Local Disk ({letter}:)"

                disks.append(Disk(
                    id=letter.upper(),
                    name=name,
                    device_path=f"\\\\.\\{letter.upper()}:",
                    total_size=total,
                    used_size=used,
                    filesystem=fs,
                    disk_type=disk_type,
                    mount_point=f"{letter.upper()}:\\",
                    label=label,
                    is_system=(letter.upper() == "C"),
                ))
        except Exception:
            pass

        return disks

    async def scan_deleted_files(
        self,
        disk: Disk,
        session_id: str,
        on_path: Callable[[str], None] | None = None,
    ) -> AsyncGenerator[DeletedFile, None]:
        loop = asyncio.get_event_loop()
        queue: asyncio.Queue[DeletedFile | None | Exception] = asyncio.Queue()

        def _walk(fs, directory, path: str):
            if on_path:
                loop.call_soon_threadsafe(on_path, path)

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
                            original_path=f"{path}\\{name}",
                            size=int(meta.size),
                            filesystem=disk.filesystem.value,
                            disk_id=disk.id,
                            extension=ext,
                            is_recoverable=int(meta.size) > 0,
                        )
                        loop.call_soon_threadsafe(queue.put_nowait, df)

                    if meta.type == pytsk3.TSK_FS_META_TYPE_DIR:
                        try:
                            sub = fs.open_dir(inode=int(meta.addr))
                            _walk(fs, sub, f"{path}\\{name}")
                        except Exception:
                            pass

                except Exception:
                    continue

        def _scan():
            try:
                print(f"[scanner] opening {disk.device_path}", flush=True)
                img = pytsk3.Img_Info(disk.device_path)
                print(f"[scanner] Img_Info OK, opening filesystem", flush=True)
                fs = pytsk3.FS_Info(img)
                print(f"[scanner] FS_Info OK, type={fs.info.ftype}, walking /", flush=True)
                _walk(fs, fs.open_dir(path="/"), disk.mount_point or "\\")
                print(f"[scanner] walk complete", flush=True)
            except OSError as exc:
                print(f"[scanner] OSError: {exc}", flush=True)
                loop.call_soon_threadsafe(
                    queue.put_nowait,
                    RuntimeError(f"Cannot open {disk.device_path}: {exc}"),
                )
            except Exception as exc:
                print(f"[scanner] Exception: {type(exc).__name__}: {exc}", flush=True)
                loop.call_soon_threadsafe(
                    queue.put_nowait,
                    RuntimeError(str(exc)),
                )
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, None)

        loop.run_in_executor(None, _scan)

        while True:
            item = await queue.get()
            if item is None:
                break
            if isinstance(item, Exception):
                raise item
            yield item
