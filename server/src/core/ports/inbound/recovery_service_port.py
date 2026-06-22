from abc import ABC, abstractmethod

from ...domain.entities.deleted_file import DeletedFile


class RecoveryServicePort(ABC):
    @abstractmethod
    async def recover(
        self,
        session_id: str,
        inode_ids: list[int],
        destination_path: str,
    ) -> list[str]:
        """Returns a list of recovered file paths."""
        ...
