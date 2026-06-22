from fastapi import APIRouter, Depends, HTTPException

from .....core.use_cases.list_disks import ListDisksUseCase
from .....core.use_cases.recover_files import RecoverFilesUseCase
from .....infrastructure.container import Container
from ..schemas.recovery_schema import RecoverRequest, RecoverResponse

router = APIRouter(prefix="/recovery", tags=["recovery"])


def _list_disks_use_case() -> ListDisksUseCase:
    return Container.list_disks_use_case()


def _recover_use_case() -> RecoverFilesUseCase:
    return Container.recover_files_use_case()


@router.post("/", response_model=RecoverResponse)
async def recover_files(
    body: RecoverRequest,
    list_disks: ListDisksUseCase = Depends(_list_disks_use_case),
    recover_uc: RecoverFilesUseCase = Depends(_recover_use_case),
):
    session = Container.get_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    disks = await list_disks.execute()
    disk = next((d for d in disks if d.id == session.disk_id), None)
    if not disk:
        raise HTTPException(status_code=404, detail="Disk not found")

    recovered = await recover_uc.execute(
        disk=disk,
        session=session,
        inode_ids=body.inode_ids,
        destination_path=body.destination_path,
    )

    return RecoverResponse(
        recovered_files=recovered,
        total_recovered=len(recovered),
    )
