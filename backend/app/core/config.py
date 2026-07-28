from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Optional


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
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
    CLOUDINARY_ROOT_FOLDER: str = "portland-gas"

    # Publicly accessible URL for the logo used in email templates
    # In production set this to your Vercel URL e.g. https://yourapp.vercel.app
    LOGO_URL: Optional[str] = None

    # Frontend base URL — used to generate QR code links for assets
    # In production set this to your Vercel URL e.g. https://yourapp.vercel.app
    FRONTEND_URL: str = "http://localhost:3000"

    # OTP
    OTP_EXPIRE_MINUTES: int = 10

    # Web Push (VAPID) — optional; push is silently skipped if not set
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: Optional[str] = None
    VAPID_PRIVATE_KEY: Optional[str] = None
    VAPID_SUBJECT: str = "mailto:admin@portlandgas.com"

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


def _warn_on_bad_public_urls() -> None:
    """
    Shout when the outward-facing URLs are still dev defaults in production.

    FRONTEND_URL and LOGO_URL are baked into every outgoing email. Getting them
    wrong fails silently — recipients get localhost links they cannot open and a
    broken logo — so surface it at boot rather than in someone's inbox.
    """
    import logging

    log = logging.getLogger(__name__)
    if settings.ENVIRONMENT.lower() in ("development", "dev", "local", "test"):
        return

    if "localhost" in settings.FRONTEND_URL or "127.0.0.1" in settings.FRONTEND_URL:
        log.warning(
            "FRONTEND_URL is %s in a %s environment — every email link will point "
            "at the recipient's own machine. Set it to the deployed frontend URL.",
            settings.FRONTEND_URL,
            settings.ENVIRONMENT,
        )

    if not settings.LOGO_URL:
        log.warning("LOGO_URL is not set — emails fall back to the plain 'PG' text mark.")
    else:
        # Check the PATH, not the whole URL: a bare domain like
        # https://example.vercel.app has dots in the host but no image to serve.
        from urllib.parse import urlparse

        path = urlparse(settings.LOGO_URL).path.lower()
        if not path.endswith((".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp")):
            log.warning(
                "LOGO_URL (%s) does not point at an image file — emails will show a "
                "broken image. Use the full path, e.g. .../Portland-gas-logo.png",
                settings.LOGO_URL,
            )


_warn_on_bad_public_urls()
