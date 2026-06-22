from abc import ABC, abstractmethod

from ...domain.entities.disk import Disk
from ...domain.entities.scan_session import ScanSession


class DiskServicePort(ABC):
    @abstractmethod
    async def get_disks(self) -> list[Disk]:
        ...

    @abstractmethod
    async def start_scan(self, disk_id: str) -> ScanSession:
        ...

    @abstractmethod
    async def get_session(self, session_id: str) -> ScanSession:
        ...

    @abstractmethod
    async def cancel_scan(self, session_id: str) -> ScanSession:
        ...
