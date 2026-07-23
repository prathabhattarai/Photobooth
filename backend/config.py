from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "TogetherFrame"
    SECRET_KEY: str = "togetherframe-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    DATABASE_URL: str = "mysql+pymysql://root:12345@localhost:3306/togetherframe"
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "https://*.vercel.app"]

    class Config:
        env_file = ".env"


settings = Settings()
