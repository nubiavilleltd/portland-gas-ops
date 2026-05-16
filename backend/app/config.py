from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Optional


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    REMEMBER_ME_EXPIRE_DAYS: int = 30
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    ENVIRONMENT: str = "development"

    # Brevo — optional until API key is provided
    BREVO_API_KEY: Optional[str] = None
    BREVO_FROM_EMAIL: str = "ebukaezeanya14@gmail.com"
    BREVO_FROM_NAME: str = "Portland Gas Operations"

    # Database SSL (set to true for cloud databases like Aiven)
    DATABASE_SSL: bool = False

    # Cloudinary — file & PDF storage
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    # Publicly accessible URL for the logo used in email templates
    # In production set this to your Vercel URL e.g. https://yourapp.vercel.app
    LOGO_URL: Optional[str] = None

    # OTP
    OTP_EXPIRE_MINUTES: int = 10

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v: object) -> List[str]:
        # Accept both comma-separated string and JSON array from .env
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v  # type: ignore[return-value]

    class Config:
        env_file = ".env"


settings = Settings()
