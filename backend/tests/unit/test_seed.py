from datetime import date

import pytest
from sqlalchemy import select

from app.core.company_portal_seed import DEFAULT_COMPANY_PORTALS
from app.core.seed import (
    DEFAULT_ROUND_TYPES,
    DEFAULT_STATUSES,
    company_portal_payload,
    seed_defaults,
)
from app.models import ApplicationStatus, CompanyPortal, RoundType


@pytest.mark.asyncio
async def test_seed_defaults_fills_partial_default_data_without_duplicates(db):
    db.add(
        ApplicationStatus(
            name="Applied",
            color="#83a598",
            is_default=True,
            user_id=None,
            order=0,
        )
    )
    await db.commit()

    await seed_defaults(db)
    await seed_defaults(db)

    status_rows = (
        (
            await db.execute(
                select(ApplicationStatus).where(ApplicationStatus.user_id.is_(None))
            )
        )
        .scalars()
        .all()
    )
    round_type_rows = (
        (await db.execute(select(RoundType).where(RoundType.user_id.is_(None))))
        .scalars()
        .all()
    )

    assert sorted(status.name for status in status_rows) == sorted(
        status["name"] for status in DEFAULT_STATUSES
    )
    assert sorted(round_type.name for round_type in round_type_rows) == sorted(
        DEFAULT_ROUND_TYPES
    )


@pytest.mark.asyncio
async def test_seed_defaults_updates_verified_portals_and_deactivates_stale_ones(db):
    db.add_all(
        [
            CompanyPortal(
                company_name="阿里巴巴",
                company_type="民营",
                company_scale="中型",
                industry="旧数据",
                city="杭州",
                careers_url="https://example.com/old",
                focus_roles=[],
                recruitment_status="needs_review",
                verification_status="needs_review",
                user_id=None,
            ),
            CompanyPortal(
                company_name="未核验旧企业",
                company_type="民营",
                company_scale="中型",
                industry="互联网",
                city="杭州",
                careers_url="https://example.com/stale",
                focus_roles=[],
                recruitment_status="open",
                verification_status="verified",
                user_id=None,
            ),
        ]
    )
    await db.commit()

    await seed_defaults(db)
    await seed_defaults(db)

    portals = (
        (await db.execute(select(CompanyPortal).where(CompanyPortal.user_id.is_(None))))
        .scalars()
        .all()
    )
    portals_by_name = {portal.company_name: portal for portal in portals}

    assert len([portal for portal in portals if portal.company_name == "阿里巴巴"]) == 1
    assert portals_by_name["阿里巴巴"].industry == "互联网与云计算"
    assert portals_by_name["阿里巴巴"].recruitment_status == "open"
    assert portals_by_name["阿里巴巴"].evidence_url
    assert portals_by_name["未核验旧企业"].is_active is False
    assert portals_by_name["未核验旧企业"].verification_status == "expired"
    assert {portal["company_name"] for portal in DEFAULT_COMPANY_PORTALS}.issubset(
        portals_by_name
    )


def test_company_portal_payload_closes_expired_deadline():
    payload = company_portal_payload(
        {
            "company_name": "已截止企业",
            "application_deadline": date(2026, 8, 27),
            "recruitment_status": "closing_soon",
            "verification_status": "verified",
            "is_active": True,
        },
        today=date(2026, 8, 28),
    )

    assert payload["recruitment_status"] == "closed"
    assert payload["verification_status"] == "expired"
    assert payload["is_active"] is False
