from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class RequirementMatch(BaseModel):
    key: str
    label: str
    coverage: Literal["strong", "partial", "gap"]
    evidence: list[str] = Field(default_factory=list)


class ResumeEntry(BaseModel):
    source_id: str
    heading: str
    subheading: str | None = None
    period: str | None = None
    bullets: list[str] = Field(default_factory=list)


class ResumeEducation(BaseModel):
    source_id: str
    institution: str
    degree: str
    field_of_study: str
    period: str | None = None


class TailoredResumeContent(BaseModel):
    target_role: str
    summary: str
    core_skills: list[str] = Field(default_factory=list)
    experiences: list[ResumeEntry] = Field(default_factory=list)
    projects: list[ResumeEntry] = Field(default_factory=list)
    education: list[ResumeEducation] = Field(default_factory=list)
    additional: list[str] = Field(default_factory=list)


class TailoredResumeCreate(BaseModel):
    job_description: str | None = Field(default=None, max_length=100_000)
    job_title: str | None = Field(default=None, max_length=255)
    company: str | None = Field(default=None, max_length=255)
    application_id: str | None = None
    job_lead_id: str | None = None

    @model_validator(mode="after")
    def require_jd_source(self):
        if (
            not self.job_description
            and not self.application_id
            and not self.job_lead_id
        ):
            raise ValueError("Provide a job description, application, or job lead")
        return self


class TailoredResumeUpdate(BaseModel):
    content: TailoredResumeContent


class TailoredResumeApprove(BaseModel):
    attach_to_application: bool = True
    content: TailoredResumeContent | None = None


class TailoredResumeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_id: str | None
    job_lead_id: str | None
    company: str | None
    job_title: str
    source_resume_filename: str | None
    jd_text: str
    jd_analysis: dict
    content: TailoredResumeContent
    validation: dict
    generation_strategy: str
    status: str
    docx_path: str | None
    docx_filename: str | None
    created_at: datetime
    updated_at: datetime
    approved_at: datetime | None
