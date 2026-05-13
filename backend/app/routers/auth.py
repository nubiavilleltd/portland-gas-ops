from fastapi import APIRouter, Depends, Response, Cookie, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas.token import LoginRequest
from app.schemas.user import UserResponse
from app.services.auth_service import login_user, refresh_access_token, logout_user
from app.middleware.auth import get_current_user
from app.models.user import User
from app.config import settings

router = APIRouter()


@router.post("/login")
def login(credentials: LoginRequest, response: Response, db: Session = Depends(get_db)):
    result = login_user(credentials, db)
    response.set_cookie(
        key="access_token",
        value=result["access_token"],
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=result["refresh_token"],
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )
    return {
        "access_token": result["access_token"],
        "token_type": "bearer",
        "user": result["user"],
    }


@router.post("/refresh")
def refresh(
    response: Response,
    refresh_token: Optional[str] = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    result = refresh_access_token(refresh_token, db)
    response.set_cookie(
        key="access_token",
        value=result["access_token"],
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return result


@router.post("/logout")
def logout(
    response: Response,
    refresh_token: Optional[str] = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if refresh_token:
        logout_user(refresh_token, db)
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
