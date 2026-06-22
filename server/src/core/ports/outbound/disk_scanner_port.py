from abc import ABC, abstractmethod
from typing import AsyncGenerator

from ...domain.entities.deleted_file import DeletedFile
from ...domain.entities.disk import Disk


class DiskScannerPort(ABC):
    @abstractmethod
    async def list_disks(self) -> list[Disk]:
        ...

    @abstractmethod
    async def scan_deleted_files(
        self,
        disk: Disk,
        session_id: str,
    ) -> AsyncGenerator[DeletedFile, None]:
        ...
