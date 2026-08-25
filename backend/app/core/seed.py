from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.company_portal_seed import DEFAULT_COMPANY_PORTALS
from app.core.reference_names import normalized_reference_name
from app.models import ApplicationStatus, CompanyPortal, RoundType

DEFAULT_STATUSES = [
    {"name": "Saved", "color": "#928374", "order": 0},
    {"name": "Applied", "color": "#83a598", "order": 1},
    {"name": "Screening", "color": "#fabd2f", "order": 2},
    {"name": "Assessment", "color": "#d79921", "order": 3},
    {"name": "Interviewing", "color": "#fe8019", "order": 4},
    {"name": "Offer", "color": "#b8bb26", "order": 5},
    {"name": "Accepted", "color": "#8ec07c", "order": 6},
    {"name": "Rejected", "color": "#fb4934", "order": 7},
    {"name": "Withdrawn", "color": "#d3869b", "order": 8},
    {"name": "No Reply", "color": "#a89984", "order": 9},
]

DEFAULT_ROUND_TYPES = [
    "Phone Screen",
    "Technical",
    "Behavioral",
    "Take-home",
    "Onsite",
    "Final",
]


def company_portal_payload(portal_data: dict, today: date | None = None) -> dict:
    payload = portal_data.copy()
    deadline = payload.get("application_deadline")
    if deadline is not None and deadline < (today or date.today()):
        payload["is_active"] = False
        payload["recruitment_status"] = "closed"
        payload["verification_status"] = "expired"
    return payload


async def seed_defaults(db: AsyncSession) -> None:
    """Seed default application statuses and round types if they are missing."""
    existing_statuses = (
        (
            await db.execute(
                select(ApplicationStatus).where(ApplicationStatus.user_id.is_(None))
            )
        )
        .scalars()
        .all()
    )
    existing_status_names = {status.normalized_name for status in existing_statuses}

    for status_data in DEFAULT_STATUSES:
        normalized_name = normalized_reference_name(status_data["name"])
        if normalized_name in existing_status_names:
            continue

        status = ApplicationStatus(
            name=status_data["name"],
            color=status_data["color"],
            order=status_data["order"],
            is_default=True,
            user_id=None,
        )
        db.add(status)
        existing_status_names.add(normalized_name)

    existing_round_types = (
        (await db.execute(select(RoundType).where(RoundType.user_id.is_(None))))
        .scalars()
        .all()
    )
    existing_round_type_names = {
        round_type.normalized_name for round_type in existing_round_types
    }

    for name in DEFAULT_ROUND_TYPES:
        normalized_name = normalized_reference_name(name)
        if normalized_name in existing_round_type_names:
            continue

        round_type = RoundType(name=name, is_default=True, user_id=None)
        db.add(round_type)
        existing_round_type_names.add(normalized_name)

    existing_portals = (
        (await db.execute(select(CompanyPortal).where(CompanyPortal.user_id.is_(None))))
        .scalars()
        .all()
    )
    existing_portals_by_name = {
        portal.company_name: portal for portal in existing_portals
    }
    seeded_names = {
        portal_data["company_name"] for portal_data in DEFAULT_COMPANY_PORTALS
    }

    for portal in existing_portals:
        if portal.company_name not in seeded_names:
            portal.is_active = False
            portal.recruitment_status = "needs_review"
            portal.verification_status = "expired"

    for portal_data in DEFAULT_COMPANY_PORTALS:
        payload = company_portal_payload(portal_data)
        portal = existing_portals_by_name.get(payload["company_name"])
        if portal is None:
            db.add(CompanyPortal(**payload, user_id=None))
            continue

        for key, value in payload.items():
            setattr(portal, key, value)

    await db.commit()
