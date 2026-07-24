import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "TogetherFrame"
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "togetherframe-prod-secret-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    DATABASE_URL: str = "mysql+pymysql://4JsJwEq131Vh4MT.root:ylr6Fmrtx07KtsUA@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/togetherframe"
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "https://*.vercel.app"]

    class Config:
        env_file = ".env"


settings = Settings()
