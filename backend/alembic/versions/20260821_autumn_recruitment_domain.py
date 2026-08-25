"""add autumn recruitment workflow and company portals

Revision ID: 20260821_autumn_domain
Revises: 20260411_job_lead_fk_name
Create Date: 2026-08-21 16:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260821_autumn_domain"
down_revision: str | Sequence[str] | None = "20260411_job_lead_fk_name"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "applications",
        sa.Column(
            "recruitment_cycle",
            sa.String(length=50),
            nullable=False,
            server_default="2027届秋招",
        ),
    )
    op.add_column(
        "applications",
        sa.Column(
            "recruitment_batch",
            sa.String(length=50),
            nullable=False,
            server_default="正式批",
        ),
    )
    op.add_column(
        "applications",
        sa.Column("target_track", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "applications",
        sa.Column("company_type", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "applications",
        sa.Column("company_scale", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "applications",
        sa.Column(
            "priority",
            sa.String(length=20),
            nullable=False,
            server_default="medium",
        ),
    )
    op.add_column(
        "applications", sa.Column("deadline", sa.Date(), nullable=True)
    )
    op.add_column(
        "applications",
        sa.Column("application_channel", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "applications",
        sa.Column("referral_code", sa.String(length=100), nullable=True),
    )
    op.add_column("applications", sa.Column("notes", sa.Text(), nullable=True))

    op.create_table(
        "recruitment_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("application_id", sa.String(length=36), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deadline_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("result", sa.String(length=100), nullable=True),
        sa.Column("link", sa.String(length=1000), nullable=True),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["application_id"], ["applications.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_recruitment_events_user_schedule",
        "recruitment_events",
        ["user_id", "scheduled_at"],
        unique=False,
    )
    op.create_index(
        "ix_recruitment_events_application_schedule",
        "recruitment_events",
        ["application_id", "scheduled_at"],
        unique=False,
    )

    op.create_table(
        "company_portals",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=True),
        sa.Column("company_name", sa.String(length=255), nullable=False),
        sa.Column("company_type", sa.String(length=50), nullable=False),
        sa.Column("company_scale", sa.String(length=50), nullable=False),
        sa.Column("industry", sa.String(length=100), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column("careers_url", sa.String(length=1000), nullable=False),
        sa.Column("campus_url", sa.String(length=1000), nullable=True),
        sa.Column(
            "focus_roles",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
        sa.Column(
            "recruitment_cycle",
            sa.String(length=50),
            nullable=False,
            server_default="2027届秋招",
        ),
        sa.Column(
            "verification_status",
            sa.String(length=30),
            nullable=False,
            server_default="verified",
        ),
        sa.Column("verified_at", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "is_active", sa.Boolean(), nullable=False, server_default=sa.true()
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_company_portals_city_scale",
        "company_portals",
        ["city", "company_scale"],
        unique=False,
    )
    op.create_index(
        "uq_company_portals_global_name",
        "company_portals",
        ["company_name"],
        unique=True,
        sqlite_where=sa.text("user_id IS NULL"),
        postgresql_where=sa.text("user_id IS NULL"),
    )
    op.create_index(
        "uq_company_portals_user_name",
        "company_portals",
        ["user_id", "company_name"],
        unique=True,
        sqlite_where=sa.text("user_id IS NOT NULL"),
        postgresql_where=sa.text("user_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_company_portals_user_name", table_name="company_portals")
    op.drop_index("uq_company_portals_global_name", table_name="company_portals")
    op.drop_index("ix_company_portals_city_scale", table_name="company_portals")
    op.drop_table("company_portals")

    op.drop_index(
        "ix_recruitment_events_application_schedule",
        table_name="recruitment_events",
    )
    op.drop_index(
        "ix_recruitment_events_user_schedule",
        table_name="recruitment_events",
    )
    op.drop_table("recruitment_events")

    op.drop_column("applications", "notes")
    op.drop_column("applications", "referral_code")
    op.drop_column("applications", "application_channel")
    op.drop_column("applications", "deadline")
    op.drop_column("applications", "priority")
    op.drop_column("applications", "company_scale")
    op.drop_column("applications", "company_type")
    op.drop_column("applications", "target_track")
    op.drop_column("applications", "recruitment_batch")
    op.drop_column("applications", "recruitment_cycle")
