from ..adapters.outbound.disk_scanner.platform_disk_scanner import PlatformDiskScanner
from ..adapters.outbound.file_recovery.tsk_file_recovery import TskFileRecovery
from ..core.domain.entities.scan_session import ScanSession
from ..core.use_cases.list_disks import ListDisksUseCase
from ..core.use_cases.recover_files import RecoverFilesUseCase
from ..core.use_cases.scan_deleted_files import ScanDeletedFilesUseCase

_sessions: dict[str, ScanSession] = {}


class Container:
    _scanner = PlatformDiskScanner()
    _recovery = TskFileRecovery()

    @classmethod
    def list_disks_use_case(cls) -> ListDisksUseCase:
        return ListDisksUseCase(cls._scanner)

    @classmethod
    def scan_deleted_files_use_case(cls) -> ScanDeletedFilesUseCase:
        return ScanDeletedFilesUseCase(cls._scanner)

    @classmethod
    def recover_files_use_case(cls) -> RecoverFilesUseCase:
        return RecoverFilesUseCase(cls._recovery)

    @classmethod
    def create_session(cls, disk_id: str) -> ScanSession:
        session = ScanSession(disk_id=disk_id)
        _sessions[session.id] = session
        return session

    @classmethod
    def get_session(cls, session_id: str) -> ScanSession | None:
        return _sessions.get(session_id)
