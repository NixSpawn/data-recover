from abc import ABC, abstractmethod

from ...domain.entities.deleted_file import DeletedFile
from ...domain.entities.disk import Disk


class FileRecoveryPort(ABC):
    @abstractmethod
    async def recover_file(
        self,
        disk: Disk,
        deleted_file: DeletedFile,
        destination_path: str,
    ) -> str:
        """Recover a single file. Returns the absolute path of the recovered file."""
        ...

    @abstractmethod
    async def recover_files(
        self,
        disk: Disk,
        deleted_files: list[DeletedFile],
        destination_path: str,
    ) -> list[str]:
        """Recover multiple files. Returns a list of recovered file paths."""
        ...
