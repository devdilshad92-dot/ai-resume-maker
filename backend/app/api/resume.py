from app.core.db import SessionLocal
import aiofiles
import shutil
import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
import json

from app.api import deps
from app.core.db import get_db
from app.models.models import User, Resume, JobDescription, Application
from app.schemas.schemas import ResumeResponse, JobDescriptionResponse, ApplicationResponse
from app.services.pdf import extract_text
from app.services.ai_service import ai_service

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    file: UploadFile = File(...)
) -> Any:
    """
    Upload a resume file (PDF/DOCX), parse it, and save to DB.
    """
    file_location = f"{UPLOAD_DIR}/{current_user.id}_{file.filename}"
    async with aiofiles.open(file_location, "wb+") as buffer:
        while content := await file.read(1024):  # Chuck wise read
            await buffer.write(content)

    # Extract Text (Non-blocking)
    text_content = await extract_text(file_location, file.content_type or "")
    if not text_content:
        raise HTTPException(
            status_code=400, detail="Could not extract text from file")

    # Parse with AI
    parsed_data = await ai_service.parse_resume(text_content)

    resume = Resume(
        user_id=current_user.id,
        file_path=file_location,
        raw_text=text_content,
        parsed_content=parsed_data
    )
    db.add(resume)
    await db.commit()
    await db.refresh(resume)
    return resume


@router.post("/job", response_model=JobDescriptionResponse)
async def submit_job_description(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    text_content: str = Form(...),
    position: str = Form(...),
    company: str = Form(...)
) -> Any:
    """
    Submit a job description to analyze.
    """
    job = JobDescription(
        user_id=current_user.id,
        text_content=text_content,
        position=position,
        company=company
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


async def background_generate_resume(app_id: int):
    """
    Background worker for resume generation.
    Creates its own DB session to avoid detached instances or concurrency issues.
    """
    async with SessionLocal() as db:
        try:
            # Re-fetch application with relationships
            result = await db.execute(
                select(Application)
                .where(Application.id == app_id)
                .options(selectinload(Application.resume), selectinload(Application.job))
            )
            application = result.scalars().first()

            if not application:
                print(f"Application {app_id} not found in worker")
                return

            # AI Logic
            generated_resume = await ai_service.generate_tailored_resume(
                application.resume.parsed_content,
                application.job.text_content,
                application.job.position
            )

            ats_result = await ai_service.calculate_ats_score(
                str(generated_resume),
                application.job.text_content
            )

            # Update DB
            application.generated_content = json.dumps(generated_resume)
            application.ats_score = ats_result.get('score', 0)
            application.ats_feedback = ats_result
            application.status = "completed"

            db.add(application)
            await db.commit()

        except Exception as e:
            print(f"Error in background generation: {e}")
            application.status = "failed"
            db.add(application)
            await db.commit()


@router.post("/generate", response_model=ApplicationResponse, status_code=202)
async def generate_tailored_resume(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    resume_id: int = Form(...),
    job_id: int = Form(...),
    background_tasks: BackgroundTasks
) -> Any:
    """
    Start background job to generate resume. Returns HTTP 202 Accepted.
    Poll /application/{id} for result.
    """
    # Create Application Record first
    application = Application(
        user_id=current_user.id,
        resume_id=resume_id,
        job_id=job_id,
        status="processing"
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)

    # Enqueue Task
    background_tasks.add_task(background_generate_resume, application.id)

    return application


@router.get("/application/{app_id}", response_model=ApplicationResponse)
async def get_application(
    app_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    result = await db.execute(select(Application).where(Application.id == app_id, Application.user_id == current_user.id))
    application = result.scalars().first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application
