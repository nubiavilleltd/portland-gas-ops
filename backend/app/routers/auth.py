from fastapi import APIRouter, Depends, Response, Cookie, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, EmailStr
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app.schemas.user import UserResponse
from app.services import auth_service
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.otp import OTPPurpose
from app.config import settings

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


# ─── Request schemas ──────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = False


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class VerifyOTPRequest(BaseModel):
    user_id: str
    code: str


class ResendOTPRequest(BaseModel):
    user_id: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    user_id: str
    code: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/register")
@limiter.limit("10/minute")
def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)):
    return auth_service.register_user(body.name, body.email, body.password, db)


@router.post("/verify-otp")
@limiter.limit("10/minute")
def verify_otp(request: Request, body: VerifyOTPRequest, db: Session = Depends(get_db)):
    return auth_service.verify_otp(body.user_id, body.code, OTPPurpose.email_verification, db)


@router.post("/resend-otp")
@limiter.limit("5/minute")
def resend_otp(request: Request, body: ResendOTPRequest, db: Session = Depends(get_db)):
    return auth_service.resend_otp(body.user_id, OTPPurpose.email_verification, db)


@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    result = auth_service.login_user(body.email, body.password, body.remember_me, db)

    max_age = result["refresh_days"] * 86400
    cookie_opts = dict(
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
    )
    response.set_cookie("access_token", result["access_token"], max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60, **cookie_opts)
    response.set_cookie("refresh_token", result["refresh_token"], max_age=max_age, **cookie_opts)

    return {"access_token": result["access_token"], "token_type": "bearer", "user": result["user"]}


@router.post("/refresh")
@limiter.limit("3/minute")
def refresh(request: Request, response: Response, refresh_token: Optional[str] = Cookie(default=None), db: Session = Depends(get_db)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    result = auth_service.refresh_access_token(refresh_token, db)
    response.set_cookie(
        "access_token", result["access_token"],
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
    )
    return result


@router.post("/logout")
def logout(response: Response, refresh_token: Optional[str] = Cookie(default=None), db: Session = Depends(get_db)):
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
    return auth_service.reset_password(body.user_id, body.code, body.new_password, db)


@router.post("/change-password")
def change_password(body: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return auth_service.change_password(current_user, body.current_password, body.new_password, db)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
