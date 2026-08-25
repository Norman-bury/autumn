"""add company portal recruitment verification fields

Revision ID: 20260822_portal_verification
Revises: 20260821_autumn_domain
Create Date: 2026-08-22 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260822_portal_verification"
down_revision: str | Sequence[str] | None = "20260821_autumn_domain"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "company_portals",
        sa.Column(
            "recruitment_status",
            sa.String(length=30),
            nullable=False,
            server_default="needs_review",
        ),
    )
    op.add_column(
        "company_portals",
        sa.Column("application_deadline", sa.Date(), nullable=True),
    )
    op.add_column(
        "company_portals",
        sa.Column("evidence_url", sa.String(length=1000), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("company_portals", "evidence_url")
    op.drop_column("company_portals", "application_deadline")
    op.drop_column("company_portals", "recruitment_status")
