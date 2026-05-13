from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timedelta
from app.models.user import User
from app.models.token import RefreshToken
from app.schemas.token import LoginRequest
from app.utils.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
)
from app.config import settings


def login_user(credentials: LoginRequest, db: Session) -> dict:
    user = (
        db.query(User)
        .filter(User.email == credentials.email, User.is_active == True)
        .first()
    )
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )

    token_data = {"sub": user.id, "email": user.email, "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token_str = create_refresh_token(token_data)

    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db_token = RefreshToken(
        user_id=user.id, token=refresh_token_str, expires_at=expires_at
    )
    db.add(db_token)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token_str,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.value,
            "department": user.department.value if user.department else None,
        },
    }


def refresh_access_token(refresh_token: str, db: Session) -> dict:
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    db_token = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token == refresh_token, RefreshToken.is_revoked == False
        )
        .first()
    )
    if not db_token or db_token.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired or revoked",
        )

    user = (
        db.query(User)
        .filter(User.id == payload.get("sub"), User.is_active == True)
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    token_data = {"sub": user.id, "email": user.email, "role": user.role.value}
    new_access_token = create_access_token(token_data)

    return {"access_token": new_access_token, "token_type": "bearer"}


def logout_user(refresh_token: str, db: Session) -> None:
    db_token = (
        db.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
    )
    if db_token:
        db_token.is_revoked = True
        db.commit()
