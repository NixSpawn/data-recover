import sys
from typing import AsyncGenerator, Callable

from ....core.domain.entities.deleted_file import DeletedFile
from ....core.domain.entities.disk import Disk
from ....core.ports.outbound.disk_scanner_port import DiskScannerPort


class PlatformDiskScanner(DiskScannerPort):
    def __init__(self) -> None:
        if sys.platform == "darwin":
            from .mac_disk_scanner import MacDiskScanner
            self._impl = MacDiskScanner()
        elif sys.platform == "win32":
            from .windows_disk_scanner import WindowsDiskScanner
            self._impl = WindowsDiskScanner()
        else:
            raise RuntimeError(f"Unsupported platform: {sys.platform}")

    async def list_disks(self) -> list[Disk]:
        return await self._impl.list_disks()

    async def scan_deleted_files(
        self,
        disk: Disk,
        session_id: str,
        on_path: Callable[[str], None] | None = None,
    ) -> AsyncGenerator[DeletedFile, None]:
        async for f in self._impl.scan_deleted_files(disk, session_id, on_path=on_path):
            yield f
