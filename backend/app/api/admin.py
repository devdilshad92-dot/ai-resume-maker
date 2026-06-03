from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.db import get_db
from app.models.models import AISettings, User
from app.schemas.schemas import AIConfigUpdate, AIConfigResponse
from app.services.ai_service import ai_service

router = APIRouter()

# Registry of models per provider shown in the admin panel
PROVIDER_MODELS: dict[str, list[str]] = {
    "gemini": [
        "gemini-2.5-pro",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
    ],
    "openai": [
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4-turbo",
        "gpt-3.5-turbo",
    ],
    "anthropic": [
        "claude-opus-4-8",
        "claude-sonnet-4-6",
        "claude-haiku-4-5-20251001",
    ],
    "openrouter": [
        "openai/gpt-4o",
        "anthropic/claude-3.5-sonnet",
        "google/gemini-flash-1.5",
        "meta-llama/llama-3.1-8b-instruct",
        "mistralai/mistral-7b-instruct",
    ],
    "groq": [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "llama3-70b-8192",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
    ],
}


def _configured_providers() -> dict[str, bool]:
    return {
        "gemini": bool(settings.GEMINI_API_KEY),
        "openai": bool(settings.OPENAI_API_KEY),
        "anthropic": bool(settings.ANTHROPIC_API_KEY),
        "openrouter": bool(settings.OPENROUTER_API_KEY),
        "groq": bool(settings.GROQ_API_KEY),
    }


@router.get("/ai-config", response_model=AIConfigResponse)
async def get_ai_config(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(AISettings).where(AISettings.id == 1))
    config = result.scalar_one_or_none()

    return AIConfigResponse(
        primaryProvider=config.primary_provider if config else "gemini",
        primaryModel=config.primary_model if config else "gemini-2.5-flash",
        fallbackProvider=config.fallback_provider if config else "gemini",
        fallbackModel=config.fallback_model if config else "gemini-2.5-flash-lite",
        configuredProviders=_configured_providers(),
        availableModels=PROVIDER_MODELS,
    )


@router.put("/ai-config", response_model=AIConfigResponse)
async def update_ai_config(
    payload: AIConfigUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(AISettings).where(AISettings.id == 1))
    config = result.scalar_one_or_none()

    if config is None:
        config = AISettings(id=1)
        db.add(config)

    config.primary_provider = payload.primaryProvider
    config.primary_model = payload.primaryModel
    config.fallback_provider = payload.fallbackProvider
    config.fallback_model = payload.fallbackModel
    await db.commit()

    # Hot-reload the running service — raises ValueError if API key missing
    try:
        ai_service.configure(
            primary_provider=payload.primaryProvider,
            primary_model=payload.primaryModel,
            fallback_provider=payload.fallbackProvider,
            fallback_model=payload.fallbackModel,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return AIConfigResponse(
        primaryProvider=payload.primaryProvider,
        primaryModel=payload.primaryModel,
        fallbackProvider=payload.fallbackProvider,
        fallbackModel=payload.fallbackModel,
        configuredProviders=_configured_providers(),
        availableModels=PROVIDER_MODELS,
    )
