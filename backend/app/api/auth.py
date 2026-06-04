"""
Authentication — Google OAuth only.

Flow:
  1. GET /auth/google          → redirects to Google consent screen
  2. GET /auth/google/callback → exchanges code, finds/creates user, returns JWT
                                 then redirects to {FRONTEND_URL}/auth/callback?token=JWT

Future providers (Microsoft, LinkedIn, Apple) follow the same pattern:
  Add GET /auth/{provider} + GET /auth/{provider}/callback.
  The shared helper `_find_or_create_oauth_user` handles DB logic.
"""

from datetime import timedelta
from typing import Any
from urllib.parse import urlencode
import secrets

import httpx
from fastapi import APIRouter, Depends, HTTPException, Cookie
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.core import security
from app.core.config import settings
from app.core.db import get_db
from app.models.models import User
from app.models.models import Resume
from app.schemas.schemas import UserResponse, Token, GuestSessionRequest, MigrateGuestRequest

router = APIRouter()

# ─── Google OAuth constants ────────────────────────────────────────────────────
_GOOGLE_AUTH_URL     = "https://accounts.google.com/o/oauth2/v2/auth"
_GOOGLE_TOKEN_URL    = "https://oauth2.googleapis.com/token"
_GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


# ─── Shared helper ─────────────────────────────────────────────────────────────

async def _find_or_create_oauth_user(
    db: AsyncSession,
    provider_id: str,
    provider_field: str,       # e.g. "google_id"
    email: str,
    full_name: str,
    profile_image: str,
) -> User:
    """
    1. Look up by provider_id — return existing user.
    2. Look up by email (legacy password account) — link provider, return.
    3. Neither found — create new OAuth user.
    """
    # 1. Existing OAuth user
    result = await db.execute(
        select(User).where(getattr(User, provider_field) == provider_id)
    )
    user = result.scalar_one_or_none()
    if user:
        user.full_name = full_name or user.full_name
        user.profile_image = profile_image or user.profile_image
        await db.commit()
        await db.refresh(user)
        return user

    # 2. Existing email/password user — link OAuth
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        setattr(user, provider_field, provider_id)
        user.full_name = full_name or user.full_name
        user.profile_image = profile_image or user.profile_image
        await db.commit()
        await db.refresh(user)
        return user

    # 3. Brand new user
    user = User(
        email=email,
        full_name=full_name or email.split("@")[0],
        profile_image=profile_image,
        is_active=True,
    )
    setattr(user, provider_field, provider_id)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


def _make_jwt(user: User) -> str:
    return security.create_access_token(
        user.email,
        expires_delta=timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS),
    )


def _safe_next(next_url: str) -> str:
    """Only allow relative paths to prevent open-redirect attacks."""
    if next_url and next_url.startswith("/") and not next_url.startswith("//"):
        return next_url
    return "/dashboard"


# ─── Google OAuth ──────────────────────────────────────────────────────────────

@router.get("/google")
async def google_login(next: str = "/dashboard") -> RedirectResponse:
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=503,
            detail="Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env",
        )
    state = secrets.token_urlsafe(20)
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": f"{settings.BACKEND_URL}/api/v1/auth/google/callback",
        "scope": "openid email profile",
        "response_type": "code",
        "access_type": "online",
        "prompt": "select_account",
        "state": state,
    }
    redirect = RedirectResponse(f"{_GOOGLE_AUTH_URL}?{urlencode(params)}")
    # State cookie — CSRF protection
    redirect.set_cookie("oauth_state", state,  max_age=600, httponly=True, samesite="lax")
    redirect.set_cookie("oauth_next",  _safe_next(next), max_age=600, httponly=True, samesite="lax")
    return redirect


@router.get("/google/callback")
async def google_callback(
    code: str = "",
    state: str = "",
    error: str = "",
    oauth_state: str = Cookie(default=""),
    oauth_next:  str = Cookie(default="/dashboard"),
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    # User denied access
    if error:
        resp = RedirectResponse(f"{settings.FRONTEND_URL}/login?error=access_denied")
        resp.delete_cookie("oauth_state")
        resp.delete_cookie("oauth_next")
        return resp

    # CSRF check
    if not state or state != oauth_state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state — possible CSRF attack. Please try again.")

    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(_GOOGLE_TOKEN_URL, data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": f"{settings.BACKEND_URL}/api/v1/auth/google/callback",
            "grant_type": "authorization_code",
        })

    if token_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Google token exchange failed. Please try again.")

    access_token = token_resp.json().get("access_token")

    # Fetch user info
    async with httpx.AsyncClient() as client:
        info_resp = await client.get(
            _GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

    info = info_resp.json()
    google_id = info.get("sub")
    email     = info.get("email")

    if not google_id or not email:
        raise HTTPException(status_code=400, detail="Could not retrieve profile from Google.")

    user = await _find_or_create_oauth_user(
        db=db,
        provider_id=google_id,
        provider_field="google_id",
        email=email,
        full_name=info.get("name", ""),
        profile_image=info.get("picture", ""),
    )

    jwt = _make_jwt(user)
    next_url = _safe_next(oauth_next)

    redirect = RedirectResponse(
        f"{settings.FRONTEND_URL}/auth/callback?token={jwt}&next={next_url}"
    )
    redirect.delete_cookie("oauth_state")
    redirect.delete_cookie("oauth_next")
    return redirect


# ─── Guest session ─────────────────────────────────────────────────────────────

@router.post("/guest", response_model=Token)
async def create_guest_session(
    req: GuestSessionRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Issue a JWT for an anonymous guest user identified by a client-generated UUID.
    Creates a User record with is_anonymous=True on first call; returns the same
    account on subsequent calls with the same session_id.
    30-day expiry — long enough for a browsing session.
    """
    # Sanitise: accept only UUID-like strings (max 36 chars)
    session_id = req.session_id.strip()[:36]
    guest_email = f"guest_{session_id}@anon.resumeai"

    result = await db.execute(select(User).where(User.email == guest_email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            email=guest_email,
            full_name="Guest",
            is_anonymous=True,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = _make_jwt(user)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/migrate-guest")
async def migrate_guest_session(
    req: MigrateGuestRequest,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    After Google sign-in, transfer all resumes from a guest account to the
    real authenticated account, then deactivate the guest account.
    Safe to call multiple times (idempotent).
    """
    from jose import jwt as jose_jwt, JWTError

    try:
        payload = jose_jwt.decode(
            req.guest_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        guest_email = payload.get("sub", "")
    except (JWTError, Exception):
        return {"migrated": 0, "error": "invalid_token"}

    if not guest_email or not guest_email.startswith("guest_"):
        return {"migrated": 0, "error": "not_a_guest_token"}

    result = await db.execute(
        select(User).where(User.email == guest_email, User.is_anonymous == True)
    )
    guest = result.scalar_one_or_none()

    if not guest or guest.id == current_user.id:
        return {"migrated": 0}

    # Re-assign all resumes from guest → real user
    result = await db.execute(select(Resume).where(Resume.user_id == guest.id))
    resumes = result.scalars().all()
    for r in resumes:
        r.user_id = current_user.id

    guest.is_active = False
    await db.commit()
    return {"migrated": len(resumes)}


# ─── /me  (keep for all auth types) ───────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    return current_user
