from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class FileCategory(str, Enum):
    PICTURE = "picture"
    VIDEO = "video"
    DOCUMENT = "document"
    AUDIO = "audio"
    ARCHIVE = "archive"
    OTHER = "other"


EXTENSION_CATEGORY_MAP: dict[str, FileCategory] = {
    # Pictures
    "jpg": FileCategory.PICTURE, "jpeg": FileCategory.PICTURE,
    "png": FileCategory.PICTURE, "gif": FileCategory.PICTURE,
    "bmp": FileCategory.PICTURE, "tiff": FileCategory.PICTURE,
    "webp": FileCategory.PICTURE, "heic": FileCategory.PICTURE,
    "raw": FileCategory.PICTURE, "cr2": FileCategory.PICTURE,
    # Videos
    "mp4": FileCategory.VIDEO, "mov": FileCategory.VIDEO,
    "avi": FileCategory.VIDEO, "mkv": FileCategory.VIDEO,
    "wmv": FileCategory.VIDEO, "flv": FileCategory.VIDEO,
    "m4v": FileCategory.VIDEO, "webm": FileCategory.VIDEO,
    # Documents
    "pdf": FileCategory.DOCUMENT, "doc": FileCategory.DOCUMENT,
    "docx": FileCategory.DOCUMENT, "xls": FileCategory.DOCUMENT,
    "xlsx": FileCategory.DOCUMENT, "ppt": FileCategory.DOCUMENT,
    "pptx": FileCategory.DOCUMENT, "txt": FileCategory.DOCUMENT,
    "csv": FileCategory.DOCUMENT, "odt": FileCategory.DOCUMENT,
    # Audio
    "mp3": FileCategory.AUDIO, "wav": FileCategory.AUDIO,
    "flac": FileCategory.AUDIO, "aac": FileCategory.AUDIO,
    "ogg": FileCategory.AUDIO, "m4a": FileCategory.AUDIO,
    # Archives
    "zip": FileCategory.ARCHIVE, "rar": FileCategory.ARCHIVE,
    "7z": FileCategory.ARCHIVE, "tar": FileCategory.ARCHIVE,
    "gz": FileCategory.ARCHIVE,
}


@dataclass
class DeletedFile:
    inode: int
    name: str
    original_path: str
    size: int
    filesystem: str
    disk_id: str
    extension: str = ""
    modified_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    is_recoverable: bool = True
    recovery_confidence: float = 1.0

    @property
    def category(self) -> FileCategory:
        return EXTENSION_CATEGORY_MAP.get(self.extension.lower(), FileCategory.OTHER)

    @property
    def display_path(self) -> str:
        return self.original_path or f"[Deleted]/{self.name}"
