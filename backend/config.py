import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "TogetherFrame"
    SECRET_KEY: str = "togetherframe-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    DATABASE_URL: str = ""
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "https://*.vercel.app"]

    class Config:
        env_file = ".env"


_settings = Settings()

if not _settings.DATABASE_URL:
    _settings.DATABASE_URL = os.environ.get(
        "DATABASE_URL",
        "mysql+pymysql://root:12345@localhost:3306/togetherframe",
    )

settings = _settings
