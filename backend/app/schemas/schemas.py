from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# User Schemas


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Token Schema


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None

# Job Schema


class JobDescriptionCreate(BaseModel):
    text_content: str
    position: Optional[str] = "Job Role"
    company: Optional[str] = "Company"


class JobDescriptionResponse(JobDescriptionCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Template Schemas


class TemplateResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str  # Fresher, Experienced, Tech, etc.
    preview_url: Optional[str] = None

# Resume Section Schemas


class ResumeSection(BaseModel):
    summary: Optional[str] = None
    skills: Optional[List[str]] = []
    work_experience: Optional[List[Dict[str, Any]]] = []
    education: Optional[List[Dict[str, Any]]] = []
    projects: Optional[List[Dict[str, Any]]] = []


class ResumeCreateScratch(BaseModel):
    job_role: str
    experience_level: str  # Fresher, Junior, Mid, Senior, Lead
    industry: str
    template_id: Optional[str] = "minimal-pro"


class ResumeUpdateSection(BaseModel):
    section_name: str  # summary, skills, work_experience, etc.
    content: Any


class ResumeResponse(BaseModel):
    id: int
    user_id: int
    parsed_content: Optional[Dict[str, Any]] = None
    file_path: Optional[str] = None
    template_id: str
    is_draft: bool
    version: int
    meta_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Application Schema (The Core AI Result)


class ApplicationCreate(BaseModel):
    resume_id: int
    job_id: int
    template_id: Optional[str] = "modern-ats"


class ApplicationResponse(BaseModel):
    id: int
    status: str
    generated_content: Optional[Dict[str, Any]] = None  # JSON Resume
    ats_score: Optional[int] = None
    ats_feedback: Optional[Dict[str, Any]] = None
    template_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# AI Assistant Schemas


class SectionAISuggestionRequest(BaseModel):
    section_name: str
    current_content: Optional[Any] = None
    job_role: str
    experience_level: str
    industry: str


class SectionAISuggestionResponse(BaseModel):
    suggestions: List[str]
    tips: List[str]
    improved_content: Optional[Any] = None
