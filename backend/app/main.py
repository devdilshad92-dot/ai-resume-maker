from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.core.config import settings
from app.core.db import engine, Base, get_session
from app.api import auth, resume, job_roles
from app.api import admin
from app.models.models import AISettings
from app.services.ai_service import ai_service

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,      prefix=f"{settings.API_V1_STR}/auth",      tags=["auth"])
app.include_router(resume.router,    prefix=f"{settings.API_V1_STR}/resume",    tags=["resume"])
app.include_router(job_roles.router, prefix=f"{settings.API_V1_STR}/job-roles", tags=["job-roles"])
app.include_router(admin.router,     prefix=f"{settings.API_V1_STR}/admin",     tags=["admin"])


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Load AI config from DB and wire up the service
    async for db in get_session():
        result = await db.execute(select(AISettings).where(AISettings.id == 1))
        config = result.scalar_one_or_none()
        if config:
            ai_service.configure(
                primary_provider=config.primary_provider,
                primary_model=config.primary_model,
                fallback_provider=config.fallback_provider,
                fallback_model=config.fallback_model,
            )
        break  # only need one iteration


@app.get("/")
def read_root():
    return {"message": "Welcome to AI Resume Maker API"}
