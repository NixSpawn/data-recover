from ..domain.entities.disk import Disk
from ..ports.outbound.disk_scanner_port import DiskScannerPort


class ListDisksUseCase:
    def __init__(self, scanner: DiskScannerPort) -> None:
        self._scanner = scanner

    async def execute(self) -> list[Disk]:
        return await self._scanner.list_disks()
