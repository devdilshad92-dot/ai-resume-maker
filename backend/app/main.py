from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, text

from app.core.config import settings
from app.core.db import engine, Base, SessionLocal
from app.api import auth, resume, job_roles
from app.api import admin
from app.api import career
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
app.include_router(career.router,    prefix=f"{settings.API_V1_STR}/career",    tags=["career"])


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # Safe column additions for existing DBs — ignored if column already exists
        migrations = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR NOT NULL DEFAULT 'free'",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT false",
            "ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL",
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id ON users (google_id)",
        ]
        for stmt in migrations:
            try:
                await conn.execute(text(stmt))
            except Exception:
                pass  # column / index already exists

    # Load AI config from DB and wire up the service
    async with SessionLocal() as db:
        result = await db.execute(select(AISettings).where(AISettings.id == 1))
        config = result.scalar_one_or_none()
        if config:
            ai_service.configure(
                primary_provider=config.primary_provider,
                primary_model=config.primary_model,
                fallback_provider=config.fallback_provider,
                fallback_model=config.fallback_model,
            )


@app.get("/")
def read_root():
    return {"message": "Welcome to AI Resume Maker API"}
