from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import uuid4

from .deleted_file import DeletedFile


class ScanStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class ScanSession:
    disk_id: str
    id: str = field(default_factory=lambda: str(uuid4()))
    status: ScanStatus = ScanStatus.PENDING
    files_found: int = 0
    bytes_scanned: int = 0
    total_bytes: int = 0
    current_path: str = ""
    files: list[DeletedFile] = field(default_factory=list)
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    error_message: Optional[str] = None

    @property
    def progress_percent(self) -> float:
        if self.total_bytes == 0:
            return 0.0
        return min((self.bytes_scanned / self.total_bytes) * 100, 100.0)

    @property
    def is_active(self) -> bool:
        return self.status in (ScanStatus.PENDING, ScanStatus.RUNNING)

    def start(self, total_bytes: int) -> None:
        self.status = ScanStatus.RUNNING
        self.started_at = datetime.utcnow()
        self.total_bytes = total_bytes

    def complete(self) -> None:
        self.status = ScanStatus.COMPLETED
        self.finished_at = datetime.utcnow()

    def fail(self, error: str) -> None:
        self.status = ScanStatus.FAILED
        self.error_message = error
        self.finished_at = datetime.utcnow()

    def cancel(self) -> None:
        self.status = ScanStatus.CANCELLED
        self.finished_at = datetime.utcnow()
