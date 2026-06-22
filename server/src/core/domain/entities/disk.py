from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class DiskType(str, Enum):
    INTERNAL = "internal"
    EXTERNAL = "external"
    REMOVABLE = "removable"
    NETWORK = "network"


class FilesystemType(str, Enum):
    NTFS = "NTFS"
    APFS = "APFS"
    HFS_PLUS = "HFS+"
    FAT32 = "FAT32"
    EXFAT = "exFAT"
    EXT4 = "ext4"
    UNKNOWN = "unknown"


@dataclass
class Disk:
    id: str
    name: str
    device_path: str
    total_size: int
    used_size: int
    filesystem: FilesystemType
    disk_type: DiskType
    mount_point: Optional[str] = None
    label: Optional[str] = None
    is_system: bool = False

    @property
    def free_size(self) -> int:
        return self.total_size - self.used_size

    @property
    def usage_percent(self) -> float:
        if self.total_size == 0:
            return 0.0
        return (self.used_size / self.total_size) * 100
