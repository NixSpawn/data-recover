from pydantic import BaseModel

from ....core.domain.entities.disk import DiskType, FilesystemType


class DiskResponse(BaseModel):
    id: str
    name: str
    device_path: str
    total_size: int
    used_size: int
    free_size: int
    usage_percent: float
    filesystem: FilesystemType
    disk_type: DiskType
    mount_point: str | None
    label: str | None
    is_system: bool
