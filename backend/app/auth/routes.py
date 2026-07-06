"""
Authentication API Routes.

Endpoints:
    POST /api/auth/signup  - Register a new user
    POST /api/auth/login   - Authenticate and receive JWT
    GET  /api/auth/me      - Get current user profile
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserLogin, UserOut, Token
from app.auth.security import (
    hash_password, verify_password, create_access_token, require_auth
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account.

    - Validates email uniqueness
    - Hashes password with bcrypt
    - First user automatically becomes admin
    - Returns JWT access token
    """
    existing = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # First user becomes admin automatically (excluding default admin seed)
    user_count = db.query(User).filter(User.email != "admin@logicflow.ai").count()
    is_admin = user_count == 0

    user = User(
        email=data.email.lower().strip(),
        hashed_password=hash_password(data.password),
        username=data.username.strip(),
        is_admin=is_admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": str(user.id)})
    return Token(
        access_token=token,
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate a user and return a JWT access token.

    - Validates email/password combination
    - Returns signed JWT with user ID in payload
    """
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(data={"sub": str(user.id)})
    return Token(
        access_token=token,
        user=UserOut.model_validate(user),
    )


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(require_auth)):
    """Get the currently authenticated user's profile."""
    return UserOut.model_validate(user)
