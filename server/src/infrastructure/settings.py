from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    host: str = "127.0.0.1"
    port: int = 8765
    cors_origins: list[str] = ["http://localhost:1420", "tauri://localhost"]
    log_level: str = "info"

    class Config:
        env_prefix = "DATA_RECOVER_"
        env_file = ".env"


settings = Settings()
