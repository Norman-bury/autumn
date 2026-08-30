"""add resume version metadata

Revision ID: 20260829_resume_versions
Revises: 20260827_resume_mail_sync
Create Date: 2026-08-29 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260829_resume_versions"
down_revision: str | Sequence[str] | None = "20260827_resume_mail_sync"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("user_profiles", sa.Column("resume_versions", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("user_profiles", "resume_versions")
