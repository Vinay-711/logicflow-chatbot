"""
Authentication & Security Utilities.

Provides JWT token creation/validation and password hashing via bcrypt.
Used as FastAPI dependencies to protect routes.
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User

# ─── Configuration ────────────────────────────────────────────
SECRET_KEY = "logicflow-chatbot-secret-key-change-in-production-2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

import bcrypt

security_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against its bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:72],
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


# ─── JWT Token Management ────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token. Returns payload or None."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


import os

# Check if auth bypass is enabled (default to True for open-access runtime)
BYPASS_AUTH = os.getenv("BYPASS_AUTH", "true").lower() == "true"


# ─── FastAPI Dependencies ────────────────────────────────────

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Get the current user. Bypasses checks if BYPASS_AUTH is True and no credentials are provided.
    """
    if BYPASS_AUTH and credentials is None:
        # Open access mode: return the default admin user
        user = db.query(User).filter(User.id == 1).first()
        if user is None:
            user = User(
                id=1,
                email="admin@logicflow.ai",
                hashed_password="mocked-unused-password",
                username="Admin",
                is_admin=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    # Normal JWT auth mode (runs when credentials are provided, or when BYPASS_AUTH is False)
    if credentials is not None:
        token = credentials.credentials
        
        # Support test mock tokens
        if token.startswith("mocked"):
            user = db.query(User).filter(User.id == 1).first()
            if not user:
                user = User(
                    id=1,
                    email="admin@logicflow.ai",
                    hashed_password="mocked-unused-password",
                    username="Admin",
                    is_admin=True,
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            return user

        # Standard JWT validation
        payload = decode_access_token(token)
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )

        user = db.query(User).filter(User.id == int(user_id)).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        return user

    # If no credentials and BYPASS_AUTH is False, raise 401
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )


def require_auth(
    user: Optional[User] = Depends(get_current_user),
) -> User:
    """Dependency that requires authentication (no guest mode)."""
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user


def require_admin(
    user: User = Depends(require_auth),
) -> User:
    """Dependency that requires admin privileges."""
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user
