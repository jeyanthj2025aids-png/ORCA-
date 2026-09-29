import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "ORCA Marine Intelligence Platform"
    PROBLEM_STATEMENT: str = "SIH26176"
    ORGANISATION: str = "ISRO / NRSC, Department of Space"
    
    # Gemini AI configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    GEMINI_REASONING_MODEL: str = os.getenv("GEMINI_REASONING_MODEL", "gemini-2.5-pro")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./orca.db")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "orca_marine")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "orca_user")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "orca_secure_password")
    
    # Provider & Simulation Modes
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "t")
    MAP_PROVIDER: str = os.getenv("MAP_PROVIDER", "maplibre")
    MAP_TOKEN: Optional[str] = os.getenv("MAP_TOKEN", None)
    
    # CORS
    CORS_ORIGINS: list[str] = ["*"]
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
