import asyncio
import json
import subprocess
from typing import AsyncGenerator, Callable

import pytsk3

from ....core.domain.entities.deleted_file import DeletedFile
from ....core.domain.entities.disk import Disk, DiskType, FilesystemType

_FILESYSTEM_MAP: dict[str, FilesystemType] = {
    "NTFS": FilesystemType.NTFS,
    "FAT32": FilesystemType.FAT32,
    "exFAT": FilesystemType.EXFAT,
}


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
                "Get-Volume | Where-Object {$_.DriveLetter -ne $null} | "
                "Select-Object DriveLetter, FileSystemLabel, FileSystem, SizeRemaining, Size, DriveType | "
                "ConvertTo-Json -Depth 3"
            )
            volumes = json.loads(raw)
            if isinstance(volumes, dict):
                volumes = [volumes]

            for vol in volumes:
                letter = vol.get("DriveLetter", "")
                if not letter:
                    continue

                fs_raw = vol.get("FileSystem") or "UNKNOWN"
                fs = _FILESYSTEM_MAP.get(fs_raw, FilesystemType.UNKNOWN)

                total = vol.get("Size") or 0
                free = vol.get("SizeRemaining") or 0
                used = total - free

                drive_type = vol.get("DriveType", 0)
                disk_type = DiskType.REMOVABLE if drive_type in (2, 5) else DiskType.INTERNAL

                disks.append(Disk(
                    id=letter,
                    name=vol.get("FileSystemLabel") or f"Local Disk ({letter}:)",
                    device_path=f"\\\\.\\{letter}:",
                    total_size=total,
                    used_size=used,
                    filesystem=fs,
                    disk_type=disk_type,
                    mount_point=f"{letter}:\\",
                    label=vol.get("FileSystemLabel"),
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
                            original_path=f"{path}\\{name}",
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
                            _walk(fs, sub, f"{path}\\{name}", disk, q, lp)
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
