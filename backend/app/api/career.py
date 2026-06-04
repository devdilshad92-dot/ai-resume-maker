from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from tenacity import RetryError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.db import get_db
from app.api import deps
from app.models.models import User, Resume
from app.schemas.schemas import CareerIntelligenceRequest
from app.services.ai_service import ai_service

router = APIRouter()


@router.post("/intelligence/{resume_id}")
async def career_intelligence(
    resume_id: int,
    req: CareerIntelligenceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Career Intelligence Platform: analyse the resume and return all 6 career
    intelligence surfaces in one call (skill gaps, promotion path, salary intel,
    interview questions, career roadmap, AI action plan).
    """
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    meta = resume.meta_data or {}
    try:
        return await ai_service.generate_career_intelligence(
            parsed_content=resume.parsed_content or {},
            job_role=meta.get("job_role", ""),
            experience_level=meta.get("experience_level", "Mid"),
            industry=meta.get("industry", ""),
            target_role=req.target_role or "",
            job_description=req.job_description or "",
        )
    except RetryError as e:
        cause = str(e.last_attempt.exception()).lower()
        if any(w in cause for w in ("quota", "exhausted", "rate limit", "billing")):
            raise HTTPException(status_code=429, detail="AI quota exceeded. Please wait a moment and try again.")
        raise HTTPException(status_code=503, detail="AI service unavailable. Please try again shortly.")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI error: {str(e)[:120]}")
