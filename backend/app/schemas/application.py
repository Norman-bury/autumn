from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.recruitment import RecruitmentEventResponse
from app.schemas.round import RoundResponse


class ApplicationExtractRequest(BaseModel):
    """Request to extract job data from URL and create an application."""

    url: str
    status_id: str
    applied_at: date | None = None
    text: str | None = None  # Optional page text content from extension


class ApplicationCreate(BaseModel):
    company: str
    job_title: str
    job_description: str | None = None
    job_url: str | None = None
    status_id: str
    applied_at: date | None = None
    # New fields for manual entry or job lead conversion
    job_lead_id: str | None = None
    location: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str | None = None
    recruiter_name: str | None = None
    recruiter_title: str | None = None
    recruiter_linkedin_url: str | None = None
    requirements_must_have: list[str] = []
    requirements_nice_to_have: list[str] = []
    skills: list[str] = []
    years_experience_min: int | None = None
    years_experience_max: int | None = None
    source: str | None = None
    recruitment_cycle: str = "2027届秋招"
    recruitment_batch: str = "正式批"
    target_track: str | None = None
    company_type: str | None = None
    company_scale: str | None = None
    priority: str = "medium"
    deadline: date | None = None
    application_channel: str | None = None
    referral_code: str | None = None
    notes: str | None = None


class ApplicationUpdate(BaseModel):
    company: str | None = None
    job_title: str | None = None
    job_description: str | None = None
    job_url: str | None = None
    status_id: str | None = None
    applied_at: date | None = None
    # New fields for updates
    location: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str | None = None
    recruiter_name: str | None = None
    recruiter_title: str | None = None
    recruiter_linkedin_url: str | None = None
    requirements_must_have: list[str] | None = None
    requirements_nice_to_have: list[str] | None = None
    skills: list[str] | None = None
    years_experience_min: int | None = None
    years_experience_max: int | None = None
    source: str | None = None
    recruitment_cycle: str | None = None
    recruitment_batch: str | None = None
    target_track: str | None = None
    company_type: str | None = None
    company_scale: str | None = None
    priority: str | None = None
    deadline: date | None = None
    application_channel: str | None = None
    referral_code: str | None = None
    notes: str | None = None


class StatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    color: str


class ApplicationListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company: str
    job_title: str
    job_description: str | None
    job_url: str | None
    status: StatusResponse
    cv_path: str | None
    cover_letter_path: str | None
    applied_at: date
    created_at: datetime
    updated_at: datetime
    # New fields from job lead conversion
    job_lead_id: str | None
    location: str | None
    salary_min: int | None
    salary_max: int | None
    salary_currency: str | None
    recruiter_name: str | None
    recruiter_title: str | None
    recruiter_linkedin_url: str | None
    requirements_must_have: list[str] = []
    requirements_nice_to_have: list[str] = []
    skills: list[str] = []
    years_experience_min: int | None
    years_experience_max: int | None
    source: str | None
    recruitment_cycle: str
    recruitment_batch: str
    target_track: str | None
    company_type: str | None
    company_scale: str | None
    priority: str
    deadline: date | None
    application_channel: str | None
    referral_code: str | None
    notes: str | None

    @field_validator(
        "requirements_must_have", "requirements_nice_to_have", "skills", mode="before"
    )
    @classmethod
    def convert_none_to_list(cls, v: Any) -> list[str]:
        """Convert None to empty list for database compatibility."""
        if v is None:
            return []
        return v


class ApplicationResponse(ApplicationListItem):
    model_config = ConfigDict(from_attributes=True)

    rounds: list[RoundResponse] = []
    recruitment_events: list[RecruitmentEventResponse] = []


class ApplicationListResponse(BaseModel):
    items: list[ApplicationListItem]
    total: int
    page: int
    per_page: int
