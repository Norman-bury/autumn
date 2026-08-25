from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, get_password_hash
from app.models import Application, ApplicationStatus, CompanyPortal, User


@pytest.mark.asyncio
async def test_local_single_user_session_bootstraps_account(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
):
    from app.api import auth

    monkeypatch.setattr(auth.settings, "single_user_mode", True)
    response = await client.post("/api/auth/local-session")

    assert response.status_code == 200
    assert response.json()["access_token"]
    assert response.json()["refresh_token"]


@pytest.fixture
async def workflow_user(db: AsyncSession) -> User:
    user = User(
        email="workflow@example.com",
        password_hash=get_password_hash("testpass123"),
        is_admin=True,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.fixture
def workflow_headers(workflow_user: User) -> dict[str, str]:
    token = create_access_token({"sub": workflow_user.id})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def workflow_application(db: AsyncSession, workflow_user: User) -> Application:
    app_status = ApplicationStatus(
        name="Assessment",
        color="#d79921",
        is_default=True,
        user_id=None,
        order=3,
    )
    db.add(app_status)
    await db.flush()
    application = Application(
        user_id=workflow_user.id,
        company="杭州测试科技",
        job_title="Agent 开发工程师",
        status_id=app_status.id,
        target_track="Agent 开发",
        company_scale="中型",
        priority="high",
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)
    return application


@pytest.mark.asyncio
async def test_recruitment_event_crud_is_scoped_to_application_owner(
    client: AsyncClient,
    workflow_headers: dict[str, str],
    workflow_application: Application,
):
    created = await client.post(
        "/api/recruitment-events",
        headers=workflow_headers,
        json={
            "application_id": workflow_application.id,
            "event_type": "assessment",
            "title": "在线测评",
            "scheduled_at": "2026-08-25T10:00:00+08:00",
            "deadline_at": "2026-08-26T23:59:00+08:00",
            "status": "pending",
            "link": "https://example.com/assessment",
        },
    )
    assert created.status_code == 201
    event_id = created.json()["id"]

    listed = await client.get(
        f"/api/recruitment-events?application_id={workflow_application.id}",
        headers=workflow_headers,
    )
    assert listed.status_code == 200
    assert listed.json()[0]["company"] == "杭州测试科技"
    assert listed.json()[0]["event_type"] == "assessment"

    updated = await client.patch(
        f"/api/recruitment-events/{event_id}",
        headers=workflow_headers,
        json={"status": "completed", "result": "passed"},
    )
    assert updated.status_code == 200
    assert updated.json()["result"] == "passed"


@pytest.mark.asyncio
async def test_company_portals_include_global_and_user_records(
    client: AsyncClient,
    db: AsyncSession,
    workflow_user: User,
    workflow_headers: dict[str, str],
):
    db.add(
        CompanyPortal(
            company_name="全局企业",
            company_type="民营",
            company_scale="中型",
            industry="企业级 Agent",
            city="杭州",
            careers_url="https://example.com/careers",
            focus_roles=["Agent 开发"],
            verified_at=datetime.now(UTC).date(),
            user_id=None,
        )
    )
    await db.commit()

    created = await client.post(
        "/api/company-portals",
        headers=workflow_headers,
        json={
            "company_name": "个人关注企业",
            "company_type": "民营",
            "company_scale": "中型",
            "industry": "大模型评测",
            "city": "杭州",
            "careers_url": "https://example.org/jobs",
            "focus_roles": ["大模型评测"],
        },
    )
    assert created.status_code == 201
    assert created.json()["user_id"] == workflow_user.id

    listed = await client.get(
        "/api/company-portals?city=杭州&company_scale=中型",
        headers=workflow_headers,
    )
    assert listed.status_code == 200
    assert {portal["company_name"] for portal in listed.json()} == {
        "全局企业",
        "个人关注企业",
    }
