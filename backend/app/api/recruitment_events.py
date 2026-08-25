from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_api_key_scope
from app.models import Application, RecruitmentEvent, User
from app.schemas.recruitment import (
    RecruitmentEventCreate,
    RecruitmentEventListItem,
    RecruitmentEventResponse,
    RecruitmentEventUpdate,
)

router = APIRouter(prefix="/api/recruitment-events", tags=["recruitment-events"])


async def _owned_application(
    db: AsyncSession, application_id: str, user_id: str
) -> Application:
    result = await db.execute(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == user_id,
        )
    )
    application = result.scalar_one_or_none()
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return application


@router.get("", response_model=list[RecruitmentEventListItem])
async def list_recruitment_events(
    application_id: str | None = None,
    event_status: str | None = Query(default=None, alias="status"),
    upcoming_only: bool = False,
    user: User = Depends(get_current_user),
    _: object = Depends(require_api_key_scope("recruitment_events:read")),
    db: AsyncSession = Depends(get_db),
) -> list[RecruitmentEventListItem]:
    query = (
        select(RecruitmentEvent, Application.company, Application.job_title)
        .join(Application, Application.id == RecruitmentEvent.application_id)
        .where(RecruitmentEvent.user_id == user.id)
    )

    if application_id:
        query = query.where(RecruitmentEvent.application_id == application_id)
    if event_status:
        query = query.where(RecruitmentEvent.status == event_status)
    if upcoming_only:
        now = datetime.now(UTC)
        query = query.where(
            RecruitmentEvent.status == "pending",
            or_(
                RecruitmentEvent.scheduled_at >= now,
                RecruitmentEvent.deadline_at >= now,
            ),
        )

    query = query.order_by(
        RecruitmentEvent.scheduled_at.asc().nullslast(),
        RecruitmentEvent.deadline_at.asc().nullslast(),
        RecruitmentEvent.created_at.desc(),
    )
    rows = (await db.execute(query)).all()

    return [
        RecruitmentEventListItem(
            **RecruitmentEventResponse.model_validate(event).model_dump(),
            company=company,
            job_title=job_title,
        )
        for event, company, job_title in rows
    ]


@router.post(
    "",
    response_model=RecruitmentEventResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_recruitment_event(
    data: RecruitmentEventCreate,
    user: User = Depends(get_current_user),
    _: object = Depends(require_api_key_scope("recruitment_events:write")),
    db: AsyncSession = Depends(get_db),
) -> RecruitmentEvent:
    await _owned_application(db, data.application_id, user.id)
    payload = data.model_dump()
    if payload["link"] is not None:
        payload["link"] = str(payload["link"])
    event = RecruitmentEvent(
        user_id=user.id,
        **payload,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.patch("/{event_id}", response_model=RecruitmentEventResponse)
async def update_recruitment_event(
    event_id: str,
    data: RecruitmentEventUpdate,
    user: User = Depends(get_current_user),
    _: object = Depends(require_api_key_scope("recruitment_events:write")),
    db: AsyncSession = Depends(get_db),
) -> RecruitmentEvent:
    result = await db.execute(
        select(RecruitmentEvent).where(
            RecruitmentEvent.id == event_id,
            RecruitmentEvent.user_id == user.id,
        )
    )
    event = result.scalar_one_or_none()
    if event is None:
        raise HTTPException(status_code=404, detail="Recruitment event not found")

    payload = data.model_dump(exclude_unset=True)
    if payload.get("link") is not None:
        payload["link"] = str(payload["link"])
    for key, value in payload.items():
        setattr(event, key, value)

    await db.commit()
    await db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recruitment_event(
    event_id: str,
    user: User = Depends(get_current_user),
    _: object = Depends(require_api_key_scope("recruitment_events:write")),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(RecruitmentEvent).where(
            RecruitmentEvent.id == event_id,
            RecruitmentEvent.user_id == user.id,
        )
    )
    event = result.scalar_one_or_none()
    if event is None:
        raise HTTPException(status_code=404, detail="Recruitment event not found")

    await db.delete(event)
    await db.commit()
