"""Authentication routes for register, login, and session info."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from auth.schemas import UserCreate, UserRead
from auth.utils import create_access_token, get_password_hash, verify_password
from config import ADMIN_EMAILS
from database.db import get_db
from database.models import User


router = APIRouter()


def user_to_read(user: User) -> UserRead:
    return UserRead(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at.isoformat() if user.created_at else None,
    )


@router.post("/register", response_model=dict)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    """Create a new user and return a JWT token."""

    try:
        email = payload.email.lower()
        existing = await db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

        role = "admin" if email in ADMIN_EMAILS else "user"
        user = User(
            email=email,
            full_name=payload.full_name,
            hashed_password=get_password_hash(payload.password),
            role=role,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        token = create_access_token(subject=user.email, role=user.role)
        return {"access_token": token, "token_type": "bearer", "user": user_to_read(user).model_dump()}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Registration failed") from exc


@router.post("/login", response_model=dict)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """Authenticate a user with username/password and return a JWT token."""

    try:
        email = form_data.username.lower()
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user or not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        token = create_access_token(subject=user.email, role=user.role)
        return {"access_token": token, "token_type": "bearer", "user": user_to_read(user).model_dump()}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Login failed") from exc


@router.get("/me", response_model=dict)
async def me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""

    return {"user": user_to_read(current_user).model_dump()}


@router.post("/logout")
async def logout(_: User = Depends(get_current_user)):
    """Stateless logout response for the frontend."""

    return {"message": "Logged out successfully"}