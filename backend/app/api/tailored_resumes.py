from datetime import UTC, datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.api.utils.zip_utils import sanitize_filename, store_file
from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import get_current_user_flexible, require_api_key_scope
from app.models import Application, JobLead, TailoredResume, User, UserProfile
from app.schemas.tailored_resume import (
    TailoredResumeApprove,
    TailoredResumeContent,
    TailoredResumeCreate,
    TailoredResumeResponse,
    TailoredResumeUpdate,
)
from app.services.resume_tailoring import (
    analyze_job_description,
    build_tailored_content,
    find_master_resume_filename,
    render_docx,
    validate_tailored_content,
)

router = APIRouter(prefix="/api/tailored-resumes", tags=["tailored-resumes"])


async def _get_owned_resume(
    db: AsyncSession, user_id: str, resume_id: str
) -> TailoredResume:
    result = await db.execute(
        select(TailoredResume).where(
            TailoredResume.id == resume_id,
            TailoredResume.user_id == user_id,
        )
    )
    resume = result.scalar_one_or_none()
    if resume is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tailored resume not found",
        )
    return resume


@router.get("", response_model=list[TailoredResumeResponse])
async def list_tailored_resumes(
    limit: int = Query(50, ge=1, le=100),
    user: User = Depends(get_current_user_flexible),
    _: object = Depends(require_api_key_scope("profile:read")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TailoredResume)
        .where(TailoredResume.user_id == user.id)
        .order_by(TailoredResume.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


@router.post(
    "",
    response_model=TailoredResumeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_tailored_resume(
    data: TailoredResumeCreate,
    user: User = Depends(get_current_user_flexible),
    _: object = Depends(require_api_key_scope("profile:write")),
    db: AsyncSession = Depends(get_db),
):
    application = None
    job_lead = None

    if data.application_id:
        result = await db.execute(
            select(Application).where(
                Application.id == data.application_id,
                Application.user_id == user.id,
            )
        )
        application = result.scalar_one_or_none()
        if application is None:
            raise HTTPException(status_code=404, detail="Application not found")

    if data.job_lead_id:
        result = await db.execute(
            select(JobLead).where(
                JobLead.id == data.job_lead_id,
                JobLead.user_id == user.id,
            )
        )
        job_lead = result.scalar_one_or_none()
        if job_lead is None:
            raise HTTPException(status_code=404, detail="Job lead not found")

    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if profile is None or not profile.work_history or not profile.projects:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Complete the structured profile before tailoring a resume",
        )

    jd_text = (
        data.job_description
        or (application.job_description if application else None)
        or (job_lead.description if job_lead else None)
    )
    if not jd_text or len(jd_text.strip()) < 20:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A complete job description is required",
        )

    job_title = (
        data.job_title
        or (application.job_title if application else None)
        or (job_lead.title if job_lead else None)
        or "目标岗位"
    )
    company = (
        data.company
        or (application.company if application else None)
        or (job_lead.company if job_lead else None)
    )

    analysis, content, validation = build_tailored_content(job_title, jd_text, profile)
    resume = TailoredResume(
        user_id=user.id,
        application_id=application.id if application else None,
        job_lead_id=job_lead.id if job_lead else None,
        company=company,
        job_title=job_title,
        source_resume_filename=find_master_resume_filename(profile),
        jd_text=jd_text,
        jd_analysis=analysis,
        content=content.model_dump(),
        validation=validation,
        generation_strategy="deterministic",
        status="draft",
    )
    db.add(resume)
    await db.commit()
    await db.refresh(resume)
    return resume


@router.get("/{resume_id}", response_model=TailoredResumeResponse)
async def get_tailored_resume(
    resume_id: str,
    user: User = Depends(get_current_user_flexible),
    _: object = Depends(require_api_key_scope("profile:read")),
    db: AsyncSession = Depends(get_db),
):
    return await _get_owned_resume(db, user.id, resume_id)


@router.patch("/{resume_id}", response_model=TailoredResumeResponse)
async def update_tailored_resume(
    resume_id: str,
    data: TailoredResumeUpdate,
    user: User = Depends(get_current_user_flexible),
    _: object = Depends(require_api_key_scope("profile:write")),
    db: AsyncSession = Depends(get_db),
):
    resume = await _get_owned_resume(db, user.id, resume_id)
    if resume.status == "approved":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Approved resumes are immutable; create a new draft instead",
        )
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one()
    resume.content = data.content.model_dump()
    analysis = analyze_job_description(resume.jd_text, profile)
    resume.validation = validate_tailored_content(profile, data.content, analysis)
    await db.commit()
    await db.refresh(resume)
    return resume


@router.post("/{resume_id}/approve", response_model=TailoredResumeResponse)
async def approve_tailored_resume(
    resume_id: str,
    data: TailoredResumeApprove,
    user: User = Depends(get_current_user_flexible),
    _: object = Depends(require_api_key_scope("profile:write")),
    db: AsyncSession = Depends(get_db),
):
    resume = await _get_owned_resume(db, user.id, resume_id)
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one()
    content = TailoredResumeContent.model_validate(resume.content)
    analysis = analyze_job_description(resume.jd_text, profile)
    validation = validate_tailored_content(profile, content, analysis)
    if not validation["valid"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Resume validation failed", **validation},
        )

    docx_bytes = await run_in_threadpool(render_docx, profile, user, content)
    settings = get_settings()
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    stored_path = await store_file(docx_bytes, upload_dir, extension=".docx")
    filename = sanitize_filename(
        f"{resume.company + '_' if resume.company else ''}{resume.job_title}_定制简历.docx"
    )

    resume.validation = validation
    resume.docx_path = stored_path
    resume.docx_filename = filename
    resume.status = "approved"
    resume.approved_at = datetime.now(UTC)

    if data.attach_to_application and resume.application_id:
        result = await db.execute(
            select(Application).where(
                Application.id == resume.application_id,
                Application.user_id == user.id,
            )
        )
        application = result.scalar_one_or_none()
        if application:
            application.cv_path = stored_path
            application.cv_original_filename = filename

    await db.commit()
    await db.refresh(resume)
    return resume


@router.get("/{resume_id}/download")
async def download_tailored_resume(
    resume_id: str,
    user: User = Depends(get_current_user_flexible),
    _: object = Depends(require_api_key_scope("profile:read")),
    db: AsyncSession = Depends(get_db),
):
    resume = await _get_owned_resume(db, user.id, resume_id)
    if not resume.docx_path:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Approve the resume before downloading it",
        )
    upload_dir = Path(get_settings().upload_dir).resolve()
    file_path = (upload_dir / Path(resume.docx_path).name).resolve()
    if file_path.parent != upload_dir or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Generated document not found")
    return FileResponse(
        file_path,
        media_type=(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ),
        filename=resume.docx_filename or "tailored-resume.docx",
    )
