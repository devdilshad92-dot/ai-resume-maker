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

# Resume Schema


class ResumeBase(BaseModel):
    raw_text: Optional[str] = None


class ResumeResponse(ResumeBase):
    id: int
    user_id: int
    parsed_content: Optional[Dict[str, Any]] = None
    file_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Application Schema (The Core AI Result)


class ApplicationCreate(BaseModel):
    resume_id: int
    job_id: int


class ApplicationResponse(BaseModel):
    id: int
    status: str
    generated_content: Optional[Dict[str, Any]] = None  # JSON Resume
    ats_score: Optional[int] = None
    ats_feedback: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
