import asyncio
import os
from pathlib import Path

import pytsk3

from ....core.domain.entities.deleted_file import DeletedFile
from ....core.domain.entities.disk import Disk
from ....core.ports.outbound.file_recovery_port import FileRecoveryPort


class TskFileRecovery(FileRecoveryPort):
    async def recover_file(
        self,
        disk: Disk,
        deleted_file: DeletedFile,
        destination_path: str,
    ) -> str:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self._recover_sync,
            disk,
            deleted_file,
            destination_path,
        )

    async def recover_files(
        self,
        disk: Disk,
        deleted_files: list[DeletedFile],
        destination_path: str,
    ) -> list[str]:
        tasks = [self.recover_file(disk, f, destination_path) for f in deleted_files]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return [r for r in results if isinstance(r, str)]

    def _recover_sync(
        self,
        disk: Disk,
        deleted_file: DeletedFile,
        destination_path: str,
    ) -> str:
        img = pytsk3.Img_Info(disk.device_path)
        fs = pytsk3.FS_Info(img)

        try:
            f = fs.open_meta(inode=deleted_file.inode)
        except Exception as exc:
            raise RuntimeError(f"Cannot open inode {deleted_file.inode}: {exc}")

        dest_dir = Path(destination_path)
        dest_dir.mkdir(parents=True, exist_ok=True)

        # Avoid name collisions by prefixing the inode
        safe_name = f"{deleted_file.inode}_{deleted_file.name}"
        dest_file = dest_dir / safe_name

        with open(dest_file, "wb") as out:
            offset = 0
            size = deleted_file.size
            chunk = 1024 * 1024  # 1 MB

            while offset < size:
                to_read = min(chunk, size - offset)
                data = f.read_random(offset, to_read)
                if not data:
                    break
                out.write(data)
                offset += len(data)

        return str(dest_file)
