from typing import List, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.db import get_db
from app.models.models import JobRole
from app.schemas.schemas import JobRoleResponse
from app.services.ai_service import ai_service

router = APIRouter()


@router.get("/search", response_model=List[JobRoleResponse])
async def search_job_roles(
    q: str = Query(..., min_length=2),
    db: AsyncSession = Depends(get_db),
) -> Any:
    # 1. DB prefix search
    result = await db.execute(
        select(JobRole)
        .where(JobRole.name.ilike(f"{q}%"))
        .order_by(JobRole.popularity.desc())
        .limit(10)
    )
    roles = list(result.scalars().all())

    # 2. AI fallback only when DB has fewer than 5 results
    if len(roles) < 5:
        ai_suggestions = await ai_service.suggest_job_roles(q)
        existing_names = {r.name.lower() for r in roles}
        new_roles: list[JobRole] = []

        for name in ai_suggestions:
            if name.lower() in existing_names or len(roles) + len(new_roles) >= 10:
                continue

            # Check if already in DB (case-insensitive)
            existing = await db.execute(
                select(JobRole).where(JobRole.name.ilike(name))
            )
            db_role = existing.scalar_one_or_none()

            if db_role:
                roles.append(db_role)
            else:
                # Persist so next search finds it without hitting AI again
                new_role = JobRole(name=name, category="AI Suggested", popularity=0)
                db.add(new_role)
                new_roles.append(new_role)
            existing_names.add(name.lower())

        if new_roles:
            await db.commit()
            for role in new_roles:
                await db.refresh(role)
            roles.extend(new_roles)

    return roles
