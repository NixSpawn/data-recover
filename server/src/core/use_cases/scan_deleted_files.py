import asyncio
from typing import Callable

from ..domain.entities.deleted_file import DeletedFile
from ..domain.entities.disk import Disk
from ..domain.entities.scan_session import ScanSession, ScanStatus
from ..ports.outbound.disk_scanner_port import DiskScannerPort


class ScanDeletedFilesUseCase:
    def __init__(self, scanner: DiskScannerPort) -> None:
        self._scanner = scanner

    async def execute(
        self,
        disk: Disk,
        session: ScanSession,
        on_file_found: Callable[[DeletedFile], None] | None = None,
    ) -> ScanSession:
        session.start(disk.total_size)

        def _on_path(path: str) -> None:
            session.current_path = path

        try:
            async for deleted_file in self._scanner.scan_deleted_files(disk, session.id, on_path=_on_path):
                if session.status == ScanStatus.CANCELLED:
                    break

                session.files.append(deleted_file)
                session.files_found += 1

                if on_file_found:
                    on_file_found(deleted_file)

            if session.status != ScanStatus.CANCELLED:
                session.complete()

        except Exception as exc:
            session.fail(str(exc))

        return session
