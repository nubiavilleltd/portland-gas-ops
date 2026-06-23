"""
Auth service — login, token management, password flows.

All accounts are created by IT (via employee_service). There is no self-registration.

Password flows:
  - Setup account:    Employee uses the link from their welcome email
                      (user_id + setup_token) to set their first password.
  - Forgot password:  A new setup_token is generated and emailed; same
                      endpoint then validates and resets the password.
  Both flows use users.setup_token / users.setup_token_expires_at.
"""

import secrets
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timedelta, timezone

from app.models.user import User, AccountStatus
from app.models.token import RefreshToken
from app.utils.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
)
from app.services.email_service import send_forgot_password
from app.config import settings


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _build_token_data(user: User) -> dict:
    return {"sub": user.id, "email": user.email, "role": user.role.value}


def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role.value,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "account_status": user.account_status.value,
    }


def _generate_reset_token() -> str:
    return secrets.token_urlsafe(36)   # 48-char URL-safe string


# ─── Login ────────────────────────────────────────────────────────────────────

def login_user(email: str, password: str, remember_me: bool, db: Session) -> dict:
    # Don't filter on is_active — it can be NULL for legacy rows; rely on account_status instead
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if user.account_status == AccountStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account setup not completed. Check your email for the setup link.",
        )

    if user.account_status == AccountStatus.deactivated:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated. Contact your administrator.",
        )

    # Record last login
    user.last_login = datetime.now(timezone.utc)

    token_data = _build_token_data(user)
    access_token = create_access_token(token_data)

    refresh_days = settings.REMEMBER_ME_EXPIRE_DAYS if remember_me else settings.REFRESH_TOKEN_EXPIRE_DAYS
    refresh_token_str = create_refresh_token(token_data, expire_days=refresh_days)

    expires_at = datetime.now(timezone.utc) + timedelta(days=refresh_days)
    db.add(RefreshToken(user_id=user.id, token=refresh_token_str, expires_at=expires_at))
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token_str,
        "refresh_days": refresh_days,
        "user": _user_dict(user),
    }


# ─── Refresh ──────────────────────────────────────────────────────────────────

def refresh_access_token(refresh_token: str, db: Session) -> dict:
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    db_token = (
        db.query(RefreshToken)
        .filter(RefreshToken.token == refresh_token, RefreshToken.is_revoked == False)
        .first()
    )
    if not db_token or db_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired or revoked")

    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return {"access_token": create_access_token(_build_token_data(user)), "token_type": "bearer"}


# ─── Logout ───────────────────────────────────────────────────────────────────

def logout_user(refresh_token: str, db: Session) -> None:
    db_token = db.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
    if db_token:
        db_token.is_revoked = True
        db.commit()


# ─── Setup account (new employee sets first password) ─────────────────────────

def setup_account(user_id: str, token: str, new_password: str, db: Session) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    _validate_setup_token(user, token)

    user.hashed_password           = hash_password(new_password)
    user.account_status            = AccountStatus.active
    user.setup_token               = None
    user.setup_token_expires_at    = None
    db.commit()

    return {"message": "Account activated. You can now sign in."}


# ─── Forgot Password ──────────────────────────────────────────────────────────

def forgot_password(email: str, db: Session) -> dict:
    # No is_active filter — anyone with a registered email can reset their password
    user = db.query(User).filter(User.email == email).first()
    if user:
        token      = _generate_reset_token()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
        user.setup_token            = token
        user.setup_token_expires_at = expires_at
        db.commit()

        frontend_url = settings.ALLOWED_ORIGINS[0]
        reset_link   = f"{frontend_url}/reset-password?user_id={user.id}&token={token}"
        name = user.first_name or user.name or user.email
        send_forgot_password(user.email, name, reset_link)

    return {"message": "If that email is registered you will receive a reset link shortly"}


# ─── Reset Password ───────────────────────────────────────────────────────────

def reset_password(user_id: str, token: str, new_password: str, db: Session) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    _validate_setup_token(user, token)

    user.hashed_password        = hash_password(new_password)
    user.setup_token            = None
    user.setup_token_expires_at = None
    # Revoke all sessions — force re-login
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update({"is_revoked": True})
    db.commit()

    return {"message": "Password reset successfully. You can now sign in."}


# ─── Change Password ──────────────────────────────────────────────────────────

def change_password(user: User, current_password: str, new_password: str, db: Session) -> dict:
    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    user.hashed_password = hash_password(new_password)
    db.query(RefreshToken).filter(RefreshToken.user_id == user.id).update({"is_revoked": True})
    db.commit()

    return {"message": "Password changed successfully. Please sign in again."}


# ─── Private helpers ──────────────────────────────────────────────────────────

def _validate_setup_token(user: User, token: str) -> None:
    if not user.setup_token or user.setup_token != token:
        raise HTTPException(status_code=400, detail="Invalid or expired setup link")
    now = datetime.now(timezone.utc)
    expiry = user.setup_token_expires_at
    if expiry is None:
        raise HTTPException(status_code=400, detail="Invalid or expired setup link")
    # Handle naive datetimes from DB
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    if expiry < now:
        raise HTTPException(status_code=400, detail="Setup link has expired. Request a new one.")
