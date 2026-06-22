from datetime import datetime
from pydantic import BaseModel

from ....core.domain.entities.deleted_file import FileCategory
from ....core.domain.entities.scan_session import ScanStatus


class DeletedFileResponse(BaseModel):
    inode: int
    name: str
    original_path: str
    size: int
    extension: str
    category: FileCategory
    filesystem: str
    disk_id: str
    is_recoverable: bool
    recovery_confidence: float
    modified_at: datetime | None
    created_at: datetime | None


class ScanSessionResponse(BaseModel):
    id: str
    disk_id: str
    status: ScanStatus
    files_found: int
    bytes_scanned: int
    total_bytes: int
    progress_percent: float
    started_at: datetime | None
    finished_at: datetime | None
    error_message: str | None


class StartScanRequest(BaseModel):
    disk_id: str
