from typing import Any, List
import shutil
import os
import json
import asyncio
import aiofiles
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.db import get_db, SessionLocal
from app.api import deps
from app.models.models import User, Resume, JobDescription, Application
from app.schemas.schemas import (
    ResumeResponse, JobDescriptionResponse, ApplicationResponse, JobDescriptionCreate,
    ApplicationCreate, TemplateResponse, ResumeCreateScratch, ResumeUpdateSection,
    SectionAISuggestionRequest, SectionAISuggestionResponse
)
from app.services.pdf import extract_text
from app.services.ai_service import ai_service

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


TEMPLATES = [
    {"id": "minimal-pro", "name": "Minimal Professional",
        "description": "Single-column, clean text-only layout favored by tech recruiters.", "category": "Experienced"},
    {"id": "modern-ats", "name": "Modern ATS",
        "description": "Optimized for parsing accuracy with clear section headers.", "category": "Tech"},
    {"id": "fresher-grad", "name": "Fresher Graduate",
        "description": "Highlights academic achievements and projects for new graduates.", "category": "Fresher"},
    {"id": "leadership", "name": "Leadership Edge",
        "description": "Focused on executive summaries and high-impact metrics.", "category": "Leadership"},
    {"id": "academic", "name": "Academic CV",
        "description": "Structured for research, publications, and teaching roles.", "category": "Academic"},
]


@router.get("/templates", response_model=List[TemplateResponse])
async def list_templates():
    return TEMPLATES


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
        parsed_content=parsed_data,
        template_id="minimal-pro",  # Default
        is_draft=False
    )
    db.add(resume)
    await db.commit()
    await db.refresh(resume)
    return resume


@router.post("/scratch", response_model=ResumeResponse)
async def create_resume_from_scratch(
    resume_in: ResumeCreateScratch,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create a new resume shell from the scratch builder.
    """
    resume = Resume(
        user_id=current_user.id,
        template_id=resume_in.template_id or "minimal-pro",
        is_draft=True,
        meta_data={
            "job_role": resume_in.job_role,
            "experience_level": resume_in.experience_level,
            "industry": resume_in.industry
        },
        parsed_content={
            "full_name": current_user.full_name or "Your Name",
            "contact_info": {"email": current_user.email},
            "summary": "",
            "skills": [],
            "work_experience": [],
            "education": [],
            "projects": []
        }
    )
    db.add(resume)
    await db.commit()
    await db.refresh(resume)
    return resume


@router.patch("/{resume_id}/update-section", response_model=ResumeResponse)
async def update_resume_section(
    resume_id: int,
    section_in: ResumeUpdateSection,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Update JSON content
    new_content = dict(resume.parsed_content)
    new_content[section_in.section_name] = section_in.content
    resume.parsed_content = new_content
    resume.version += 1

    db.add(resume)
    await db.commit()
    await db.refresh(resume)
    return resume


@router.post("/ai-assistant", response_model=SectionAISuggestionResponse)
async def get_ai_assistant_suggestions(
    req: SectionAISuggestionRequest,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get AI-powered suggestions for specific resume sections.
    """
    suggestions = await ai_service.get_section_suggestions(
        section_name=req.section_name,
        job_role=req.job_role,
        experience_level=req.experience_level,
        current_content=req.current_content
    )
    return suggestions


@router.post("/job", response_model=JobDescriptionResponse)
async def submit_job_description(
    job_in: JobDescriptionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Submit a job description to analyze.
    """
    job = JobDescription(
        user_id=current_user.id,
        text_content=job_in.text_content,
        position=job_in.position,
        company=job_in.company
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
                application.job.position,
                template_id=application.template_id
            )

            ats_result = await ai_service.calculate_ats_score(
                str(generated_resume),
                application.job.text_content
            )

            # Update DB
            application.generated_content = generated_resume  # It's already a dict
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
    app_in: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    background_tasks: BackgroundTasks = BackgroundTasks()
) -> Any:
    """
    Start background job to generate resume. Returns HTTP 202 Accepted.
    Poll /application/{id} for result.
    """
    # Create Application Record first
    application = Application(
        user_id=current_user.id,
        resume_id=app_in.resume_id,
        job_id=app_in.job_id,
        template_id=app_in.template_id or "modern-ats",
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
