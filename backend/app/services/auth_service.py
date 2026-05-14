import random
import string
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timedelta
from app.models.user import User
from app.models.token import RefreshToken
from app.models.otp import OTPCode, OTPPurpose
from app.utils.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
)
from app.services.email_service import send_otp_verification, send_forgot_password, send_welcome
from app.config import settings


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def _build_token_data(user: User) -> dict:
    return {"sub": user.id, "email": user.email, "role": user.role.value}


def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role.value,
        "department": user.department.value if user.department else None,
        "is_verified": user.is_verified,
    }


# ─── Register ─────────────────────────────────────────────────────────────────

def register_user(name: str, email: str, password: str, db: Session) -> dict:
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=name,
        email=email,
        hashed_password=hash_password(password),
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    db.flush()  # get user.id without committing

    # Create OTP
    otp_code = _generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    otp = OTPCode(
        user_id=user.id,
        code=otp_code,
        purpose=OTPPurpose.email_verification,
        expires_at=expires_at,
    )
    db.add(otp)
    db.commit()

    # Send verification email (logs to console if no API key)
    send_otp_verification(user.email, user.name, otp_code)

    return {"message": "Account created. Check your email for the verification code.", "user_id": user.id}


# ─── Verify OTP ───────────────────────────────────────────────────────────────

def verify_otp(user_id: str, code: str, purpose: OTPPurpose, db: Session) -> dict:
    otp = (
        db.query(OTPCode)
        .filter(
            OTPCode.user_id == user_id,
            OTPCode.code == code,
            OTPCode.purpose == purpose,
            OTPCode.is_used == False,
        )
        .order_by(OTPCode.created_at.desc())
        .first()
    )

    if not otp:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    if otp.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code has expired")

    otp.is_used = True

    if purpose == OTPPurpose.email_verification:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.is_verified = True
        db.commit()

        # Send welcome email
        login_url = f"{settings.ALLOWED_ORIGINS[0]}/login"
        send_welcome(user.email, user.name, login_url)

        return {"message": "Email verified successfully. You can now sign in."}

    db.commit()
    return {"message": "Code verified"}


# ─── Resend OTP ───────────────────────────────────────────────────────────────

def resend_otp(user_id: str, purpose: OTPPurpose, db: Session) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if purpose == OTPPurpose.email_verification and user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    # Invalidate previous unused OTPs for this purpose
    db.query(OTPCode).filter(
        OTPCode.user_id == user_id,
        OTPCode.purpose == purpose,
        OTPCode.is_used == False,
    ).update({"is_used": True})

    otp_code = _generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    otp = OTPCode(user_id=user.id, code=otp_code, purpose=purpose, expires_at=expires_at)
    db.add(otp)
    db.commit()

    if purpose == OTPPurpose.email_verification:
        send_otp_verification(user.email, user.name, otp_code)

    return {"message": "A new verification code has been sent to your email"}


# ─── Login ────────────────────────────────────────────────────────────────────

def login_user(email: str, password: str, remember_me: bool, db: Session) -> dict:
    user = db.query(User).filter(User.email == email, User.is_active == True).first()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your email for the verification code.",
            headers={"X-User-Id": user.id},
        )

    token_data = _build_token_data(user)
    access_token = create_access_token(token_data)

    refresh_days = settings.REMEMBER_ME_EXPIRE_DAYS if remember_me else settings.REFRESH_TOKEN_EXPIRE_DAYS
    refresh_token_str = create_refresh_token(token_data, expire_days=refresh_days)

    expires_at = datetime.utcnow() + timedelta(days=refresh_days)
    db_token = RefreshToken(user_id=user.id, token=refresh_token_str, expires_at=expires_at)
    db.add(db_token)
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
    if not db_token or db_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired or revoked")

    user = db.query(User).filter(User.id == payload.get("sub"), User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    new_access_token = create_access_token(_build_token_data(user))
    return {"access_token": new_access_token, "token_type": "bearer"}


# ─── Logout ───────────────────────────────────────────────────────────────────

def logout_user(refresh_token: str, db: Session) -> None:
    db_token = db.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
    if db_token:
        db_token.is_revoked = True
        db.commit()


# ─── Forgot Password ──────────────────────────────────────────────────────────

def forgot_password(email: str, db: Session) -> dict:
    # Always return the same message — don't leak whether the email exists
    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if user:
        otp_code = _generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=30)
        otp = OTPCode(
            user_id=user.id,
            code=otp_code,
            purpose=OTPPurpose.password_reset,
            expires_at=expires_at,
        )
        db.add(otp)
        db.commit()

        frontend_url = settings.ALLOWED_ORIGINS[0]
        reset_link = f"{frontend_url}/reset-password?user_id={user.id}&code={otp_code}"
        send_forgot_password(user.email, user.name, reset_link)

    return {"message": "If that email is registered you will receive a reset link shortly"}


# ─── Reset Password ───────────────────────────────────────────────────────────

def reset_password(user_id: str, code: str, new_password: str, db: Session) -> dict:
    result = verify_otp(user_id, code, OTPPurpose.password_reset, db)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(new_password)
    db.commit()

    # Revoke all existing refresh tokens for security
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update({"is_revoked": True})
    db.commit()

    return {"message": "Password reset successfully. You can now sign in with your new password."}


# ─── Change Password ──────────────────────────────────────────────────────────

def change_password(user: User, current_password: str, new_password: str, db: Session) -> dict:
    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    user.hashed_password = hash_password(new_password)

    # Revoke all refresh tokens — force re-login on all devices
    db.query(RefreshToken).filter(RefreshToken.user_id == user.id).update({"is_revoked": True})
    db.commit()

    return {"message": "Password changed successfully. Please sign in again."}
