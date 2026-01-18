from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, resume, job_roles
from app.core.db import engine, Base

app = FastAPI(title=settings.PROJECT_NAME,
              openapi_url=f"{settings.API_V1_STR}/openapi.json")

# CORS
origins = settings.BACKEND_CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(
    auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(
    resume.router, prefix=f"{settings.API_V1_STR}/resume", tags=["resume"])
app.include_router(
    job_roles.router, prefix=f"{settings.API_V1_STR}/job-roles", tags=["job-roles"])


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        # Create tables if they don't exist
        await conn.run_sync(Base.metadata.create_all)


@app.get("/")
def read_root():
    return {"message": "Welcome to AI Resume Maker API"}
