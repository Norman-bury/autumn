from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_api_key_scope
from app.models import CompanyPortal, User
from app.schemas.recruitment import (
    CompanyPortalCreate,
    CompanyPortalResponse,
    CompanyPortalUpdate,
)

router = APIRouter(prefix="/api/company-portals", tags=["company-portals"])


def _portal_payload(data: CompanyPortalCreate | CompanyPortalUpdate) -> dict:
    payload = data.model_dump(exclude_unset=True)
    for key in ("careers_url", "campus_url", "evidence_url"):
        if payload.get(key) is not None:
            payload[key] = str(payload[key])
    return payload


@router.get("", response_model=list[CompanyPortalResponse])
async def list_company_portals(
    search: str | None = None,
    city: str | None = None,
    company_scale: str | None = None,
    company_type: str | None = None,
    recruitment_status: str | None = None,
    active_only: bool = True,
    user: User = Depends(get_current_user),
    _: object = Depends(require_api_key_scope("company_portals:read")),
    db: AsyncSession = Depends(get_db),
) -> list[CompanyPortal]:
    query = select(CompanyPortal).where(
        or_(CompanyPortal.user_id == user.id, CompanyPortal.user_id.is_(None))
    )
    if active_only:
        query = query.where(CompanyPortal.is_active.is_(True))
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                CompanyPortal.company_name.ilike(search_term),
                CompanyPortal.industry.ilike(search_term),
                CompanyPortal.notes.ilike(search_term),
            )
        )
    if city:
        query = query.where(CompanyPortal.city == city)
    if company_scale:
        query = query.where(CompanyPortal.company_scale == company_scale)
    if company_type:
        query = query.where(CompanyPortal.company_type == company_type)
    if recruitment_status:
        query = query.where(CompanyPortal.recruitment_status == recruitment_status)

    query = query.order_by(
        CompanyPortal.application_deadline.asc().nulls_last(),
        CompanyPortal.company_scale.asc(),
        CompanyPortal.company_name.asc(),
    )
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post(
    "",
    response_model=CompanyPortalResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_company_portal(
    data: CompanyPortalCreate,
    user: User = Depends(get_current_user),
    _: object = Depends(require_api_key_scope("company_portals:write")),
    db: AsyncSession = Depends(get_db),
) -> CompanyPortal:
    duplicate = await db.execute(
        select(CompanyPortal).where(
            CompanyPortal.user_id == user.id,
            CompanyPortal.company_name == data.company_name,
        )
    )
    if duplicate.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Company portal already exists")

    portal = CompanyPortal(user_id=user.id, **_portal_payload(data))
    db.add(portal)
    await db.commit()
    await db.refresh(portal)
    return portal


@router.patch("/{portal_id}", response_model=CompanyPortalResponse)
async def update_company_portal(
    portal_id: str,
    data: CompanyPortalUpdate,
    user: User = Depends(get_current_user),
    _: object = Depends(require_api_key_scope("company_portals:write")),
    db: AsyncSession = Depends(get_db),
) -> CompanyPortal:
    result = await db.execute(
        select(CompanyPortal).where(CompanyPortal.id == portal_id)
    )
    portal = result.scalar_one_or_none()
    if portal is None:
        raise HTTPException(status_code=404, detail="Company portal not found")
    if portal.user_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="Built-in company portals are read-only",
        )

    for key, value in _portal_payload(data).items():
        setattr(portal, key, value)
    await db.commit()
    await db.refresh(portal)
    return portal


@router.delete("/{portal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company_portal(
    portal_id: str,
    user: User = Depends(get_current_user),
    _: object = Depends(require_api_key_scope("company_portals:write")),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(CompanyPortal).where(CompanyPortal.id == portal_id)
    )
    portal = result.scalar_one_or_none()
    if portal is None:
        raise HTTPException(status_code=404, detail="Company portal not found")
    if portal.user_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="Built-in company portals cannot be deleted",
        )

    await db.delete(portal)
    await db.commit()
