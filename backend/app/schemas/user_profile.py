"""Pydantic schemas for UserProfile model.

These schemas handle request/response validation for the user profile API endpoints.
"""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class WorkHistoryItem(BaseModel):
    """Schema for a single work history entry.

    This is a flexible schema that allows various work history formats.
    """

    company: str | None = Field(None, description="Company name")
    title: str | None = Field(None, description="Job title")
    start_date: str | None = Field(None, description="Start date of employment")
    end_date: str | None = Field(
        None, description="End date of employment (or 'Present')"
    )
    description: str | None = Field(
        None, description="Job description or accomplishments"
    )
    location: str | None = Field(None, description="Work location")
    highlights: list[str] | None = Field(None, description="Key achievements")


class EducationItem(BaseModel):
    """Schema for a single education entry.

    This is a flexible schema that allows various education formats.
    """

    institution: str | None = Field(None, description="School or institution name")
    degree: str | None = Field(
        None, description="Degree type (e.g., 'Bachelor of Science')"
    )
    field_of_study: str | None = Field(None, description="Field of study or major")
    start_date: str | None = Field(None, description="Start date")
    end_date: str | None = Field(None, description="End date or expected graduation")
    gpa: str | None = Field(None, description="GPA if applicable")


class ProjectItem(BaseModel):
    """Schema for a project entry extracted from a resume."""

    name: str | None = Field(None, description="Project name")
    role: str | None = Field(None, description="Candidate role in the project")
    start_date: str | None = Field(None, description="Project start date")
    end_date: str | None = Field(None, description="Project end date")
    description: str | None = Field(None, description="Project description")
    technologies: list[str] | None = Field(None, description="Technologies used")
    highlights: list[str] | None = Field(None, description="Key project highlights")


class ResumeVersionItem(BaseModel):
    """Metadata for one uploaded resume version.

    The actual file remains in CAS storage. This metadata is enough for the
    website to show role-specific resume variants without exposing raw resume
    text to the browser extension autofill endpoint.
    """

    file_path: str = Field(..., description="CAS relative file path")
    original_filename: str = Field(..., description="Original uploaded filename")
    uploaded_at: str = Field(..., description="ISO timestamp when uploaded")
    content_type: str | None = Field(None, description="Browser-provided content type")
    size_bytes: int | None = Field(None, description="Original file size in bytes")
    parsed_at: str | None = Field(None, description="ISO timestamp when PDF text was parsed")
    source: str | None = Field(None, description="Extraction strategy: ai, heuristic, or stored")
    is_current: bool = Field(False, description="Whether this is the active profile resume")


class UserProfileBase(BaseModel):
    """Base schema with shared UserProfile fields."""

    # Personal info
    first_name: str | None = Field(None, max_length=100, description="First name")
    last_name: str | None = Field(None, max_length=100, description="Last name")
    email: EmailStr | None = Field(None, description="Email address")
    phone: str | None = Field(None, max_length=50, description="Phone number")
    location: str | None = Field(
        None, max_length=255, description="Location (city, state/country)"
    )
    linkedin_url: str | None = Field(
        None, max_length=512, description="LinkedIn profile URL"
    )
    github_url: str | None = Field(None, max_length=512, description="GitHub URL")
    portfolio_url: str | None = Field(
        None, max_length=512, description="Portfolio or personal website URL"
    )
    highest_degree: str | None = Field(
        None, max_length=100, description="Highest degree or education level"
    )
    graduation_year: str | None = Field(
        None, max_length=20, description="Graduation year or expected graduation"
    )
    target_roles: list[str] | None = Field(
        None, description="Target job roles for applications"
    )
    preferred_locations: list[str] | None = Field(
        None, description="Preferred work locations"
    )
    expected_salary: str | None = Field(
        None, max_length=100, description="Expected salary range"
    )

    # User-level location fields
    city: str | None = Field(None, max_length=100, description="City")
    country: str | None = Field(None, max_length=100, description="Country")

    # Work authorization
    authorized_to_work: str | None = Field(
        None,
        max_length=100,
        description="Work authorization status (e.g., 'US Citizen', 'Green Card Holder')",
    )
    requires_sponsorship: bool | None = Field(
        None,
        description="Whether the candidate requires visa sponsorship",
    )

    # Extended profile (JSON)
    work_history: list[dict[str, Any]] | None = Field(
        None,
        description="List of work history entries",
    )
    education: list[dict[str, Any]] | None = Field(
        None,
        description="List of education entries",
    )
    skills: list[str] | None = Field(
        None,
        description="List of skills",
    )
    projects: list[dict[str, Any]] | None = Field(
        None,
        description="List of project entries",
    )
    certificates: list[str] | None = Field(
        None,
        description="List of certificates, awards, or honors",
    )
    languages: list[str] | None = Field(
        None,
        description="List of spoken or programming languages",
    )
    self_summary: str | None = Field(
        None,
        description="Short profile summary for application forms",
    )

    @field_validator("linkedin_url")
    @classmethod
    def validate_linkedin_url(cls, v: str | None) -> str | None:
        """Ensure LinkedIn URL is valid if provided."""
        if v is None:
            return v
        if not v.startswith(("http://", "https://")):
            raise ValueError("LinkedIn URL must start with http:// or https://")
        if "linkedin.com" not in v.lower():
            raise ValueError("URL must be a valid LinkedIn URL")
        return v

    @field_validator("github_url", "portfolio_url")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        """Ensure optional web URLs include a scheme when provided."""
        if v is None:
            return v
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        """Basic phone number validation."""
        if v is None:
            return v
        # Remove common formatting characters and check if remaining chars are valid
        cleaned = (
            v.replace(" ", "")
            .replace("-", "")
            .replace("(", "")
            .replace(")", "")
            .replace("+", "")
        )
        if not cleaned.isdigit():
            raise ValueError(
                "Phone number must contain only digits, spaces, hyphens, parentheses, and +"
            )
        if len(cleaned) < 7:
            raise ValueError("Phone number is too short")
        if len(cleaned) > 15:
            raise ValueError("Phone number is too long")
        return v

    @field_validator(
        "skills",
        "target_roles",
        "preferred_locations",
        "certificates",
        "languages",
        mode="before",
    )
    @classmethod
    def validate_string_list(cls, v: list[str] | None) -> list[str] | None:
        """Ensure list fields contain non-empty strings."""
        if v is None:
            return v
        if not isinstance(v, list):
            raise ValueError("Value must be a list")
        # Filter out empty strings and ensure all items are strings
        validated = []
        for skill in v:
            if isinstance(skill, str):
                trimmed = skill.strip()
                if trimmed:
                    validated.append(trimmed)
            else:
                raise ValueError("All items must be strings")
        return validated if validated else None


class UserProfileUpdate(UserProfileBase):
    """Schema for updating a user profile via PUT /api/profile.

    All fields are optional to support partial updates.
    The user_id is inferred from the authenticated user.
    """

    pass


class UserProfileCreate(UserProfileBase):
    """Schema for creating a new user profile.

    This is typically used internally when creating a profile for a new user.
    The user_id must be provided explicitly.
    """

    user_id: str = Field(..., description="ID of the user this profile belongs to")


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Full response schema for a user profile.

    Includes all fields from the UserProfile model.
    """

    id: str
    user_id: str

    # Personal info
    first_name: str | None
    last_name: str | None
    email: str | None
    phone: str | None
    location: str | None
    linkedin_url: str | None
    github_url: str | None = None
    portfolio_url: str | None = None
    highest_degree: str | None = None
    current_school: str | None = None
    major: str | None = None
    education_start_date: str | None = None
    education_end_date: str | None = None
    graduation_year: str | None = None
    target_roles: list[str] | None = None
    preferred_locations: list[str] | None = None
    expected_salary: str | None = None

    # User-level location fields
    city: str | None = None
    country: str | None = None

    # Work authorization
    authorized_to_work: str | None
    requires_sponsorship: bool | None

    # Extended profile (JSON)
    work_history: list[dict[str, Any]] | None
    education: list[dict[str, Any]] | None
    skills: list[str] | None
    projects: list[dict[str, Any]] | None = None
    certificates: list[str] | None = None
    languages: list[str] | None = None
    self_summary: str | None = None
    resume_file_path: str | None = None
    resume_original_filename: str | None = None
    resume_versions: list[ResumeVersionItem] | None = None
    resume_parsed_at: datetime | None = None


class AutofillFieldPolicy(BaseModel):
    """Safety policy metadata for a browser autofill field."""

    risk_level: Literal["safe", "sensitive", "never"]
    autofill_allowed: bool
    reason: str | None = None


class UserProfileAutofillResponse(BaseModel):
    """Minimal profile payload for the browser extension autofill engine.

    This intentionally excludes raw resume text, uploaded file paths, detailed work
    history, education entries, project data, and unconfirmed high-impact answers.
    The browser extension receives enough information to fill low-risk form fields
    and policy metadata to detect sensitive fields without guessing.
    """

    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    city: str | None = None
    country: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None
    highest_degree: str | None = None
    current_school: str | None = None
    major: str | None = None
    education_start_date: str | None = None
    education_end_date: str | None = None
    graduation_year: str | None = None
    target_roles: list[str] | None = None
    preferred_locations: list[str] | None = None
    skills: list[str] | None = None
    self_summary: str | None = None
    field_policies: dict[str, AutofillFieldPolicy]
    never_guess: list[str]
