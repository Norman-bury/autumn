from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

EventType = Literal[
    "application",
    "written_test",
    "assessment",
    "interview",
    "hr_interview",
    "medical",
    "background_check",
    "offer",
    "signing",
    "follow_up",
    "other",
]
EventStatus = Literal["pending", "completed", "cancelled", "missed"]
Priority = Literal["high", "medium", "low"]
RecruitmentStatus = Literal[
    "open",
    "closing_soon",
    "rolling",
    "closed",
    "needs_review",
]


class RecruitmentEventBase(BaseModel):
    event_type: EventType
    title: str = Field(min_length=1, max_length=255)
    status: EventStatus = "pending"
    scheduled_at: datetime | None = None
    deadline_at: datetime | None = None
    result: str | None = Field(default=None, max_length=100)
    link: HttpUrl | None = None
    location: str | None = Field(default=None, max_length=255)
    notes: str | None = None


class RecruitmentEventCreate(RecruitmentEventBase):
    application_id: str


class RecruitmentEventUpdate(BaseModel):
    event_type: EventType | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    status: EventStatus | None = None
    scheduled_at: datetime | None = None
    deadline_at: datetime | None = None
    result: str | None = Field(default=None, max_length=100)
    link: HttpUrl | None = None
    location: str | None = Field(default=None, max_length=255)
    notes: str | None = None


class RecruitmentEventResponse(RecruitmentEventBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_id: str
    created_at: datetime
    updated_at: datetime


class RecruitmentEventListItem(RecruitmentEventResponse):
    company: str
    job_title: str


class CompanyPortalBase(BaseModel):
    company_name: str = Field(min_length=1, max_length=255)
    company_type: str = Field(min_length=1, max_length=50)
    company_scale: str = Field(min_length=1, max_length=50)
    industry: str = Field(min_length=1, max_length=100)
    city: str = Field(min_length=1, max_length=100)
    careers_url: HttpUrl
    campus_url: HttpUrl | None = None
    focus_roles: list[str] = Field(default_factory=list)
    recruitment_cycle: str = Field(default="2027届秋招", max_length=50)
    recruitment_status: RecruitmentStatus = "open"
    application_deadline: date | None = None
    verification_status: Literal["verified", "needs_review", "expired"] = "verified"
    verified_at: date | None = None
    evidence_url: HttpUrl | None = None
    notes: str | None = None
    is_active: bool = True


class CompanyPortalCreate(CompanyPortalBase):
    pass


class CompanyPortalUpdate(BaseModel):
    company_name: str | None = Field(default=None, min_length=1, max_length=255)
    company_type: str | None = Field(default=None, min_length=1, max_length=50)
    company_scale: str | None = Field(default=None, min_length=1, max_length=50)
    industry: str | None = Field(default=None, min_length=1, max_length=100)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    careers_url: HttpUrl | None = None
    campus_url: HttpUrl | None = None
    focus_roles: list[str] | None = None
    recruitment_cycle: str | None = Field(default=None, max_length=50)
    recruitment_status: RecruitmentStatus | None = None
    application_deadline: date | None = None
    verification_status: Literal["verified", "needs_review", "expired"] | None = None
    verified_at: date | None = None
    evidence_url: HttpUrl | None = None
    notes: str | None = None
    is_active: bool | None = None


class CompanyPortalResponse(CompanyPortalBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str | None
    created_at: datetime
    updated_at: datetime
