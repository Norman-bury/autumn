from dataclasses import asdict
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_api_key_scope
from app.core.security import encrypt_api_key
from app.models import EmailSyncConfig, RecruitmentMail, User
from app.schemas.email_sync import (
    EmailSyncConfigResponse,
    EmailSyncConfigUpdate,
    EmailSyncResult,
    RecruitmentMailResponse,
)
from app.services.email_sync import sync_imap_messages_async

router = APIRouter(prefix="/api/email-sync", tags=["email-sync"])


def _config_response(config: EmailSyncConfig) -> EmailSyncConfigResponse:
    return EmailSyncConfigResponse(
        id=config.id,
        provider=config.provider,
        imap_host=config.imap_host,
        imap_port=config.imap_port,
        username=config.username,
        use_ssl=config.use_ssl,
        enabled=config.enabled,
        has_password=bool(config.encrypted_password),
        last_sync_at=config.last_sync_at,
    )


@router.get("/config", response_model=EmailSyncConfigResponse | None)
async def get_email_sync_config(
    user: User = Depends(get_current_user),
    _: object = Depends(require_api_key_scope("profile:read")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EmailSyncConfig).where(EmailSyncConfig.user_id == user.id)
    )
    config = result.scalar_one_or_none()
    return _config_response(config) if config else None


@router.put("/config", response_model=EmailSyncConfigResponse)
async def update_email_sync_config(
    data: EmailSyncConfigUpdate,
    user: User = Depends(get_current_user),
    _: object = Depends(require_api_key_scope("profile:write")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EmailSyncConfig).where(EmailSyncConfig.user_id == user.id)
    )
    config = result.scalar_one_or_none()
    if config is None:
        config = EmailSyncConfig(
            user_id=user.id,
            provider=data.provider,
            imap_host=data.imap_host,
            imap_port=data.imap_port,
            username=data.username,
            use_ssl=data.use_ssl,
            enabled=data.enabled,
        )
        db.add(config)
    else:
        config.provider = data.provider
        config.imap_host = data.imap_host
        config.imap_port = data.imap_port
        config.username = data.username
        config.use_ssl = data.use_ssl
        config.enabled = data.enabled

    if data.password:
        config.encrypted_password = encrypt_api_key(data.password)

    await db.commit()
    await db.refresh(config)
    return _config_response(config)


@router.get("/messages", response_model=list[RecruitmentMailResponse])
async def list_recruitment_mails(
    limit: int = Query(50, ge=1, le=200),
    user: User = Depends(get_current_user),
    _: object = Depends(require_api_key_scope("profile:read")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RecruitmentMail)
        .where(RecruitmentMail.user_id == user.id)
        .order_by(RecruitmentMail.received_at.desc().nullslast(), RecruitmentMail.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


@router.post("/sync", response_model=EmailSyncResult)
async def sync_recruitment_mails(
    limit: int = Query(50, ge=1, le=200),
    user: User = Depends(get_current_user),
    _: object = Depends(require_api_key_scope("profile:write")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EmailSyncConfig).where(EmailSyncConfig.user_id == user.id)
    )
    config = result.scalar_one_or_none()
    if not config or not config.enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email sync is not configured or disabled",
        )

    try:
        parsed_messages = await sync_imap_messages_async(config, limit=limit)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Email sync failed: {exc}",
        )

    imported: list[RecruitmentMail] = []
    skipped = 0
    for parsed in parsed_messages:
        existing = await db.execute(
            select(RecruitmentMail).where(
                RecruitmentMail.user_id == user.id,
                RecruitmentMail.message_id == parsed.message_id,
            )
        )
        if existing.scalar_one_or_none():
            skipped += 1
            continue
        mail = RecruitmentMail(user_id=user.id, **asdict(parsed))
        db.add(mail)
        imported.append(mail)

    config.last_sync_at = datetime.now(UTC)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        skipped += len(imported)
        imported = []

    return EmailSyncResult(imported=len(imported), skipped=skipped, messages=imported)
