"""User Profile API router.

This module provides API endpoints for managing user profiles, including:
- Creating and updating user profiles
- Retrieving user profile information
- Managing personal information, work authorization, and extended profile data

All endpoints require authentication via Bearer token.
"""

import re
from datetime import UTC, datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.utils.zip_utils import sanitize_filename, store_file
from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import (
    get_current_user,
    get_current_user_flexible,
    require_api_key_scope,
)
from app.models import User
from app.models.user_profile import UserProfile
from app.schemas.resume import ResumeParseResponse
from app.schemas.user_profile import (
    AutofillFieldPolicy,
    UserProfileAutofillResponse,
    UserProfileResponse,
    UserProfileUpdate,
)
from app.services.ai_settings import get_ai_settings
from app.services.extraction import ExtractionError
from app.services.resume_extraction import (
    ResumeProfileExtraction,
    extract_resume_profile_heuristic,
    extract_resume_profile_with_llm_async,
    extract_resume_text_from_pdf,
)

router = APIRouter(prefix="/api/profile", tags=["profile"])

SAFE_AUTOFILL_FIELDS = {
    "first_name",
    "last_name",
    "full_name",
    "email",
    "phone",
    "city",
    "country",
    "linkedin_url",
    "github_url",
    "portfolio_url",
    "highest_degree",
    "current_school",
    "major",
    "education_start_date",
    "education_end_date",
    "graduation_year",
    "target_roles",
    "preferred_locations",
    "skills",
    "self_summary",
}
SENSITIVE_AUTOFILL_FIELDS = {
    "expected_salary",
    "work_authorization",
    "requires_sponsorship",
    "relocation",
    "available_start_date",
    "notice_period",
    "employment_status",
}
NEVER_AUTOFILL_FIELDS = {
    "voluntary_self_identification",
    "gender",
    "race_ethnicity",
    "veteran_status",
    "disability_status",
    "background_check",
    "non_compete",
}
NEVER_GUESS_FIELDS = [
    "legal name",
    "work authorization",
    "sponsorship",
    "employment status",
    "salary expectations",
    "relocation",
    "degree dates",
    "employment dates",
    "voluntary self-identification",
    "background check or non-compete questions",
]


def _build_profile_response(profile: UserProfile, user: User) -> UserProfileResponse:
    """Build a profile response dict including user-level city/country fields.

    Args:
        profile: The user's UserProfile record
        user: The User record with city/country fields

    Returns:
        A dict that matches UserProfileResponse schema
    """
    return {  # type: ignore[return-value]
        "id": profile.id,
        "user_id": profile.user_id,
        "first_name": profile.first_name,
        "last_name": profile.last_name,
        "email": profile.email,
        "phone": profile.phone,
        "location": profile.location,
        "linkedin_url": profile.linkedin_url,
        "github_url": profile.github_url,
        "portfolio_url": profile.portfolio_url,
        "highest_degree": profile.highest_degree,
        "graduation_year": profile.graduation_year,
        "target_roles": profile.target_roles,
        "preferred_locations": profile.preferred_locations,
        "expected_salary": profile.expected_salary,
        "city": user.city,
        "country": user.country,
        "authorized_to_work": profile.authorized_to_work,
        "requires_sponsorship": profile.requires_sponsorship,
        "work_history": profile.work_history,
        "education": profile.education,
        "skills": profile.skills,
        "projects": profile.projects,
        "certificates": profile.certificates,
        "languages": profile.languages,
        "self_summary": profile.self_summary,
        "resume_file_path": profile.resume_file_path,
        "resume_original_filename": profile.resume_original_filename,
        "resume_versions": profile.resume_versions,
        "resume_parsed_at": profile.resume_parsed_at,
    }


def _build_autofill_response(
    profile: UserProfile, user: User
) -> UserProfileAutofillResponse:
    """Build the least-privilege profile payload for browser autofill."""

    primary_education = _get_primary_education(profile)
    education_start_date = (
        str(primary_education.get("start_date")) if primary_education else None
    )
    education_end_date = str(primary_education.get("end_date")) if primary_education else None
    graduation_year = profile.graduation_year or _year_from_date(education_end_date)

    policies: dict[str, AutofillFieldPolicy] = {}
    for field in SAFE_AUTOFILL_FIELDS:
        policies[field] = AutofillFieldPolicy(risk_level="safe", autofill_allowed=True)
    for field in SENSITIVE_AUTOFILL_FIELDS:
        policies[field] = AutofillFieldPolicy(
            risk_level="sensitive",
            autofill_allowed=False,
            reason=(
                "Needs explicit user confirmation before autofill; do not guess "
                "work authorization, sponsorship, compensation, relocation, "
                "start-date, or employment-status answers."
            ),
        )
    for field in NEVER_AUTOFILL_FIELDS:
        policies[field] = AutofillFieldPolicy(
            risk_level="never",
            autofill_allowed=False,
            reason=(
                "Manual review only; voluntary identity, legal, background, and "
                "non-compete fields are never autofilled."
            ),
        )

    return UserProfileAutofillResponse(
        first_name=profile.first_name,
        last_name=profile.last_name,
        email=profile.email,
        phone=profile.phone,
        city=user.city,
        country=user.country,
        linkedin_url=profile.linkedin_url,
        github_url=profile.github_url,
        portfolio_url=profile.portfolio_url,
        highest_degree=profile.highest_degree,
        current_school=str(primary_education.get("institution"))
        if primary_education and primary_education.get("institution")
        else None,
        major=str(primary_education.get("field_of_study"))
        if primary_education and primary_education.get("field_of_study")
        else None,
        education_start_date=education_start_date,
        education_end_date=education_end_date,
        graduation_year=graduation_year,
        target_roles=profile.target_roles,
        preferred_locations=profile.preferred_locations,
        skills=profile.skills,
        self_summary=profile.self_summary,
        field_policies=policies,
        never_guess=NEVER_GUESS_FIELDS,
    )


async def _get_or_create_profile(db: AsyncSession, user: User) -> UserProfile:
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one_or_none()

    if profile is not None:
        return profile

    try:
        async with db.begin_nested():
            profile = UserProfile(user_id=user.id)
            db.add(profile)
            await db.flush()
    except IntegrityError:
        pass

    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    return result.scalar_one()


def _merge_extracted_profile(
    profile: UserProfile, user: User, extracted: ResumeProfileExtraction
) -> None:
    data = extracted.model_dump(exclude_none=True)
    city = data.pop("city", None)
    country = data.pop("country", None)
    if city:
        user.city = city
    if country:
        user.country = country

    for field, value in data.items():
        if value not in (None, "", [], {}):
            setattr(profile, field, value)


def _get_primary_education(profile: UserProfile) -> dict | None:
    """Return the most relevant education item for campus applications."""

    education_items = profile.education or []
    if not education_items:
        return None

    degree_priority = ["博士", "硕士", "研究生", "本科"]
    for degree in degree_priority:
        for item in education_items:
            if degree in str(item.get("degree") or ""):
                return item
    return education_items[0]


def _year_from_date(value: str | None) -> str | None:
    if not value:
        return None
    match = re.search(r"20\d{2}", value)
    return match.group(0) if match else value


def _append_resume_version(
    profile: UserProfile,
    *,
    stored_path: str,
    original_filename: str,
    content_type: str | None,
    size_bytes: int,
    uploaded_at: datetime,
    parsed_at: datetime | None,
    source: str,
) -> None:
    """Record uploaded resume metadata while keeping only one active version."""

    versions = [dict(item) for item in (profile.resume_versions or [])]
    for item in versions:
        item["is_current"] = False

    entry = {
        "file_path": stored_path,
        "original_filename": original_filename,
        "uploaded_at": uploaded_at.isoformat(),
        "content_type": content_type,
        "size_bytes": size_bytes,
        "parsed_at": parsed_at.isoformat() if parsed_at else None,
        "source": source,
        "is_current": True,
    }

    existing_index = next(
        (
            index
            for index, item in enumerate(versions)
            if item.get("file_path") == stored_path
        ),
        None,
    )
    if existing_index is None:
        versions.append(entry)
    else:
        versions[existing_index] = {**versions[existing_index], **entry}

    profile.resume_versions = versions[-20:]


@router.get("", response_model=UserProfileResponse)
async def get_profile(
    user: User = Depends(get_current_user_flexible),
    _: object = Depends(require_api_key_scope("profile:read")),
    db: AsyncSession = Depends(get_db),
) -> UserProfileResponse:
    """Get the current user's profile, creating an empty one if it doesn't exist.

    Uses SAVEPOINT (nested transaction) to handle race conditions in a
    database-agnostic way. Works with both SQLite and PostgreSQL.

    Args:
        user: The authenticated user
        db: Database session

    Returns:
        The user's profile, with empty fields if newly created
    """
    profile = await _get_or_create_profile(db, user)

    await db.commit()
    return _build_profile_response(profile, user)


@router.get("/autofill", response_model=UserProfileAutofillResponse)
async def get_autofill_profile(
    user: User = Depends(get_current_user_flexible),
    _: object = Depends(require_api_key_scope("profile:read")),
    db: AsyncSession = Depends(get_db),
) -> UserProfileAutofillResponse:
    """Get a minimal, safety-filtered profile for browser autofill.

    This endpoint is intended for the browser extension. It does not expose raw
    resume text, uploaded file paths, detailed experience records, or sensitive
    high-impact answers. Sensitive fields are represented through policy metadata
    so the extension can detect and skip them rather than guessing.
    """
    profile = await _get_or_create_profile(db, user)

    await db.commit()
    return _build_autofill_response(profile, user)


@router.put("", response_model=UserProfileResponse)
async def update_profile(
    profile_update: UserProfileUpdate,
    user: User = Depends(get_current_user),
    _: object = Depends(require_api_key_scope("profile:write")),
    db: AsyncSession = Depends(get_db),
) -> UserProfileResponse:
    """Update the current user's profile with partial update support.

    Only fields provided in the request will be updated. Fields not included
    in the request remain unchanged.

    Args:
        profile_update: The profile update data with optional fields
        user: The authenticated user
        db: Database session

    Returns:
        The updated user profile
    """
    profile = await _get_or_create_profile(db, user)

    # Extract only the fields that were provided in the request
    update_data = profile_update.model_dump(exclude_unset=True)

    # Handle city and country separately (they're on the User model)
    if "city" in update_data:
        user.city = update_data.pop("city")
    if "country" in update_data:
        user.country = update_data.pop("country")

    # Update only the provided fields on the profile
    for field, value in update_data.items():
        setattr(profile, field, value)

    # Commit the changes
    await db.commit()
    await db.refresh(profile)

    return _build_profile_response(profile, user)


@router.post("/resume", response_model=ResumeParseResponse)
async def upload_resume(
    file: UploadFile,
    user: User = Depends(get_current_user),
    _: object = Depends(require_api_key_scope("profile:write")),
    db: AsyncSession = Depends(get_db),
) -> ResumeParseResponse:
    """Upload a resume PDF, parse it, and keep a version history on profile."""
    filename = sanitize_filename(file.filename or "resume.pdf")
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF resumes are supported for parsing in this version",
        )

    settings = get_settings()
    content = await file.read()
    max_size = settings.max_document_size_mb * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Resume exceeds maximum size of {settings.max_document_size_mb}MB",
        )
    if not content.startswith(b"%PDF"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded resume is not a valid PDF file",
        )

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    stored_path = await store_file(content, upload_dir)
    uploaded_at = datetime.now(UTC)

    try:
        resume_text = extract_resume_text_from_pdf(content)
    except ExtractionError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.message
        )

    extraction_source = "heuristic"
    ai_settings = await get_ai_settings(db)
    if ai_settings.is_configured:
        try:
            extracted = await extract_resume_profile_with_llm_async(
                resume_text,
                model=ai_settings.model,
                api_key=ai_settings.api_key,
                api_base=ai_settings.base_url,
            )
            extraction_source = "ai"
        except ExtractionError:
            extracted = extract_resume_profile_heuristic(resume_text)
    else:
        extracted = extract_resume_profile_heuristic(resume_text)

    profile = await _get_or_create_profile(db, user)
    _merge_extracted_profile(profile, user, extracted)
    profile.resume_file_path = stored_path
    profile.resume_original_filename = filename
    profile.resume_text = resume_text
    profile.resume_parsed_at = uploaded_at
    _append_resume_version(
        profile,
        stored_path=stored_path,
        original_filename=filename,
        content_type=file.content_type,
        size_bytes=len(content),
        uploaded_at=uploaded_at,
        parsed_at=uploaded_at,
        source=extraction_source,
    )

    await db.commit()
    await db.refresh(profile)

    return ResumeParseResponse(
        profile=_build_profile_response(profile, user),
        extracted_text_preview=resume_text[:1000],
        source=extraction_source,
    )
