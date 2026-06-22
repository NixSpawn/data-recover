import sys

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.adapters.inbound.api.router import api_router
from src.infrastructure.settings import settings


def _check_privileges() -> None:
    if sys.platform == "win32":
        import ctypes
        if not ctypes.windll.shell32.IsUserAnAdmin():
            print(
                "[ERROR] This server must run as Administrator on Windows.\n"
                "Right-click your terminal and choose 'Run as administrator'.",
                flush=True,
            )
            sys.exit(1)
    elif sys.platform == "darwin":
        import os
        if os.geteuid() != 0:
            print(
                "[WARNING] On macOS, raw disk scanning requires sudo.\n"
                "Run: sudo uv run python main.py",
                flush=True,
            )

app = FastAPI(
    title="Data Recovery Server",
    version="1.0.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


if __name__ == "__main__":
    _check_privileges()
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
        log_level=settings.log_level,
    )
