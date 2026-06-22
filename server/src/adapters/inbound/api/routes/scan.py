import asyncio
import json
from typing import AsyncGenerator

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import StreamingResponse

from .....core.domain.entities.scan_session import ScanStatus
from .....core.use_cases.list_disks import ListDisksUseCase
from .....core.use_cases.scan_deleted_files import ScanDeletedFilesUseCase
from .....infrastructure.container import Container
from ..schemas.scan_schema import (
    DeletedFileResponse,
    ScanSessionResponse,
    StartScanRequest,
)

router = APIRouter(prefix="/scan", tags=["scan"])


def _list_disks_use_case() -> ListDisksUseCase:
    return Container.list_disks_use_case()


def _scan_use_case() -> ScanDeletedFilesUseCase:
    return Container.scan_deleted_files_use_case()


@router.post("/start", response_model=ScanSessionResponse)
async def start_scan(
    body: StartScanRequest,
    background_tasks: BackgroundTasks,
    list_disks: ListDisksUseCase = Depends(_list_disks_use_case),
    scan_uc: ScanDeletedFilesUseCase = Depends(_scan_use_case),
):
    disks = await list_disks.execute()
    disk = next((d for d in disks if d.id == body.disk_id), None)

    if not disk:
        raise HTTPException(status_code=404, detail=f"Disk '{body.disk_id}' not found")

    session = Container.create_session(body.disk_id)

    background_tasks.add_task(scan_uc.execute, disk, session)

    return _to_session_response(session)


@router.get("/{session_id}", response_model=ScanSessionResponse)
async def get_session(session_id: str):
    session = Container.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return _to_session_response(session)


@router.delete("/{session_id}", response_model=ScanSessionResponse)
async def cancel_scan(session_id: str):
    session = Container.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.cancel()
    return _to_session_response(session)


@router.get("/{session_id}/files", response_model=list[DeletedFileResponse])
async def get_files(
    session_id: str,
    category: str | None = None,
    extension: str | None = None,
    min_size: int | None = None,
    limit: int = 500,
    offset: int = 0,
):
    session = Container.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    files = session.files

    if category:
        files = [f for f in files if f.category.value == category]
    if extension:
        files = [f for f in files if f.extension.lower() == extension.lower()]
    if min_size is not None:
        files = [f for f in files if f.size >= min_size]

    return [_to_file_response(f) for f in files[offset: offset + limit]]


@router.get("/{session_id}/stream")
async def stream_scan(session_id: str):
    """SSE endpoint — streams newly found files as they are discovered."""
    session = Container.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    async def _event_generator() -> AsyncGenerator[str, None]:
        sent = 0
        while True:
            current = session.files
            if len(current) > sent:
                for f in current[sent:]:
                    data = _to_file_response(f).model_dump_json()
                    yield f"data: {data}\n\n"
                sent = len(current)

            if not session.is_active:
                yield f"data: {json.dumps({'event': 'done', 'status': session.status})}\n\n"
                break

            await asyncio.sleep(0.5)

    return StreamingResponse(_event_generator(), media_type="text/event-stream")


def _to_session_response(session) -> ScanSessionResponse:
    return ScanSessionResponse(
        id=session.id,
        disk_id=session.disk_id,
        status=session.status,
        files_found=session.files_found,
        bytes_scanned=session.bytes_scanned,
        total_bytes=session.total_bytes,
        progress_percent=session.progress_percent,
        started_at=session.started_at,
        finished_at=session.finished_at,
        error_message=session.error_message,
    )


def _to_file_response(f) -> DeletedFileResponse:
    return DeletedFileResponse(
        inode=f.inode,
        name=f.name,
        original_path=f.original_path,
        size=f.size,
        extension=f.extension,
        category=f.category,
        filesystem=f.filesystem,
        disk_id=f.disk_id,
        is_recoverable=f.is_recoverable,
        recovery_confidence=f.recovery_confidence,
        modified_at=f.modified_at,
        created_at=f.created_at,
    )
