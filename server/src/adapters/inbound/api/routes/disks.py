from fastapi import APIRouter, Depends

from .....core.use_cases.list_disks import ListDisksUseCase
from .....infrastructure.container import Container
from ..schemas.disk_schema import DiskResponse

router = APIRouter(prefix="/disks", tags=["disks"])


def _use_case() -> ListDisksUseCase:
    return Container.list_disks_use_case()


@router.get("/", response_model=list[DiskResponse])
async def list_disks(use_case: ListDisksUseCase = Depends(_use_case)):
    disks = await use_case.execute()
    return [
        DiskResponse(
            id=d.id,
            name=d.name,
            device_path=d.device_path,
            total_size=d.total_size,
            used_size=d.used_size,
            free_size=d.free_size,
            usage_percent=d.usage_percent,
            filesystem=d.filesystem,
            disk_type=d.disk_type,
            mount_point=d.mount_point,
            label=d.label,
            is_system=d.is_system,
        )
        for d in disks
    ]
