from pydantic import BaseModel


class RecoverRequest(BaseModel):
    session_id: str
    inode_ids: list[int]
    destination_path: str


class RecoverResponse(BaseModel):
    recovered_files: list[str]
    total_recovered: int
