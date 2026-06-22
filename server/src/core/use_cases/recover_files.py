from ..domain.entities.disk import Disk
from ..domain.entities.deleted_file import DeletedFile
from ..domain.entities.scan_session import ScanSession
from ..ports.outbound.file_recovery_port import FileRecoveryPort


class RecoverFilesUseCase:
    def __init__(self, recovery: FileRecoveryPort) -> None:
        self._recovery = recovery

    async def execute(
        self,
        disk: Disk,
        session: ScanSession,
        inode_ids: list[int],
        destination_path: str,
    ) -> list[str]:
        files_to_recover = [f for f in session.files if f.inode in inode_ids]

        if not files_to_recover:
            return []

        return await self._recovery.recover_files(disk, files_to_recover, destination_path)
