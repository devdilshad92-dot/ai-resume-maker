from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=True)          # null for OAuth-only users
    google_id = Column(String, unique=True, index=True, nullable=True)
    profile_image = Column(String, nullable=True)
    subscription_plan = Column(String, default="free", nullable=False, server_default="free")
    is_anonymous = Column(Boolean, default=False, nullable=False, server_default="false")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    resumes = relationship("Resume", back_populates="owner")
    jobs = relationship("JobDescription", back_populates="owner")
    applications = relationship("Application", back_populates="owner")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    file_path = Column(String, nullable=True)
    parsed_content = Column(JSON, nullable=True)  # Structured data
    raw_text = Column(Text, nullable=True)

    # New Fields
    template_id = Column(String, default="minimal-pro")
    is_draft = Column(Boolean, default=True)
    version = Column(Integer, default=1)
    meta_data = Column(JSON, nullable=True)  # {job_role, industry, level}

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="resumes")
    applications = relationship("Application", back_populates="resume")


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    text_content = Column(Text)
    position = Column(String, nullable=True)
    company = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="jobs")
    applications = relationship("Application", back_populates="job")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    job_id = Column(Integer, ForeignKey("job_descriptions.id"))

    # The AI rewritten resume content
    generated_content = Column(JSON)  # Structured content for templates
    ats_score = Column(Integer)
    ats_feedback = Column(JSON)

    template_id = Column(String, default="modern-ats")

    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="applications")
    resume = relationship("Resume", back_populates="applications")
    job = relationship("JobDescription", back_populates="applications")


class JobRole(Base):
    __tablename__ = "job_roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    category = Column(String, index=True)
    popularity = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AISettings(Base):
    """Single-row table (id=1) storing the active AI provider/model config."""
    __tablename__ = "ai_settings"

    id = Column(Integer, primary_key=True, default=1)
    primary_provider = Column(String, nullable=False, default="gemini")
    primary_model = Column(String, nullable=False, default="gemini-2.5-flash")
    fallback_provider = Column(String, nullable=True, default="gemini")
    fallback_model = Column(String, nullable=True, default="gemini-2.5-flash-lite")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
