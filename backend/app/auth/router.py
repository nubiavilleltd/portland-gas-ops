import re
from fastapi import APIRouter, Depends, Response, Cookie, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import get_db
from app.users.schemas import UserResponse
from app.auth import service as auth_service
from app.shared.dependencies import get_current_user
from app.shared.models.user import User
from app.core.config import settings

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


# ─── Request schemas ──────────────────────────────────────────────────────────

def _validate_password(v: str) -> str:
    errors = []
    if len(v) < 8:
        errors.append("at least 8 characters")
    if not re.search(r"[A-Z]", v):
        errors.append("one uppercase letter")
    if not re.search(r"[0-9]", v):
        errors.append("one number")
    if not re.search(r"[^A-Za-z0-9]", v):
        errors.append("one special character")
    if errors:
        raise ValueError("Password must contain: " + ", ".join(errors))
    return v


class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = False


class SetupAccountRequest(BaseModel):
    user_id: str
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _validate_password(v)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    user_id: str
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _validate_password(v)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _validate_password(v)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    result = auth_service.login_user(body.email, body.password, body.remember_me, db)

    max_age = result["refresh_days"] * 86400
    # Only the refresh token lives in an HttpOnly cookie.
    # The access token is returned in the response body and stored in memory on the client.
    response.set_cookie(
        "refresh_token", result["refresh_token"],
        max_age=max_age,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
    )

    return {"access_token": result["access_token"], "token_type": "bearer", "user": result["user"]}


@router.post("/setup-account")
@limiter.limit("5/minute")
def setup_account(request: Request, body: SetupAccountRequest, db: Session = Depends(get_db)):
    """Called when an IT-created employee clicks their setup email link."""
    return auth_service.setup_account(body.user_id, body.token, body.new_password, db)


@router.post("/refresh")
@limiter.limit("30/minute")
def refresh(
    request: Request,
    refresh_token: Optional[str] = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    result = auth_service.refresh_access_token(refresh_token, db)
    # Return new access token in body only — client stores it in memory
    return result


@router.post("/logout")
def logout(
    response: Response,
    refresh_token: Optional[str] = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if refresh_token:
        auth_service.logout_user(refresh_token, db)
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}


@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return auth_service.forgot_password(body.email, db)


@router.post("/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, body: ResetPasswordRequest, db: Session = Depends(get_db)):
    return auth_service.reset_password(body.user_id, body.token, body.new_password, db)


@router.post("/change-password")
def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return auth_service.change_password(current_user, body.current_password, body.new_password, db)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
