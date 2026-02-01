from typing import List, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.db import get_db
from app.models.models import JobRole
from app.schemas.schemas import JobRoleResponse
from app.services.ai_service import ai_service
import json

router = APIRouter()

# Centralized metadata to avoid frontend hardcoding
METADATA = {
    "industries": [
        "Technology", "Fintech & Finance", "Healthcare & Pharma",
        "E-commerce & Retail", "Education & EdTech", "Marketing & Advertising",
        "Real Estate", "Manufacturing", "Logistics & Supply Chain",
        "Energy & Utilities", "Entertainment & Media", "Hospitality & Travel",
        "Non-Profit", "Other"
    ],
    "experience_levels": ["Fresher", "Junior", "Mid", "Senior", "Lead", "Principal"]
}


@router.get("/metadata")
async def get_metadata() -> Any:
    """Return common metadata like industries and experience levels."""
    return METADATA


# Simple in-memory cache to avoid redundant AI calls during a session
# In production, this would be Redis
AI_ROLE_CACHE = {}


@router.get("/search", response_model=List[JobRoleResponse])
async def search_job_roles(
    q: str = Query("", min_length=0),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Search for job roles. Returns popular roles if q is empty.
    """
    clean_q = q.strip().lower()

    # 1. Database Search
    if not clean_q:
        query = select(JobRole).order_by(JobRole.popularity.desc()).limit(10)
    else:
        query = select(JobRole).where(JobRole.name.ilike(f"{clean_q}%")).order_by(
            JobRole.popularity.desc()).limit(10)

    result = await db.execute(query)
    roles = result.scalars().all()

    # 2. AI Fallback: If few results, call AI to suggest more roles
    if len(roles) < 5:
        if clean_q in AI_ROLE_CACHE:
            ai_suggestions = AI_ROLE_CACHE[clean_q]
        else:
            ai_suggestions = await ai_service.suggest_job_roles(q)
            AI_ROLE_CACHE[clean_q] = ai_suggestions

        # Add AI suggestions that aren't already in the list
        existing_names = {r.name.lower() for r in roles}
        for suggestion in ai_suggestions:
            if suggestion.lower() not in existing_names:
                roles.append(JobRole(name=suggestion, category="AI Suggested"))
                if len(roles) >= 10:
                    break

    return roles


@router.post("/select")
async def select_job_role(
    name: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Increment popularity for a selected job role."""
    # Find existing
    query = select(JobRole).where(JobRole.name.ilike(name))
    result = await db.execute(query)
    role = result.scalar_one_or_none()

    if role:
        role.popularity += 1
    else:
        # Create new one if it doesn't exist (Self-learning)
        role = JobRole(name=name, category="Generic", popularity=1)
        db.add(role)

    await db.commit()
    return {"status": "success"}
