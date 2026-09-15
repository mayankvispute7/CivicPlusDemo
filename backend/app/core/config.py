"""CIVIC PULSE — Core configuration."""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = "sqlite:///./civicpulse.db"
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "civicpulse"
    db_user: str = "civicpulse"
    db_password: str = "civicpulse"

    # Server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    # AI
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None

    # Mode
    demo_mode: bool = False

    @property
    def use_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
