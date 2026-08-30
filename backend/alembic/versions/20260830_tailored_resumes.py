"""add tailored resumes

Revision ID: 20260830_tailored_resumes
Revises: 20260829_resume_versions
Create Date: 2026-08-30 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260830_tailored_resumes"
down_revision: str | Sequence[str] | None = "20260829_resume_versions"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "tailored_resumes",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("application_id", sa.String(36), nullable=True),
        sa.Column("job_lead_id", sa.String(36), nullable=True),
        sa.Column("company", sa.String(255), nullable=True),
        sa.Column("job_title", sa.String(255), nullable=False),
        sa.Column("source_resume_filename", sa.String(255), nullable=True),
        sa.Column("jd_text", sa.Text(), nullable=False),
        sa.Column("jd_analysis", sa.JSON(), nullable=False),
        sa.Column("content", sa.JSON(), nullable=False),
        sa.Column("validation", sa.JSON(), nullable=False),
        sa.Column(
            "generation_strategy",
            sa.String(50),
            nullable=False,
            server_default="deterministic",
        ),
        sa.Column(
            "status", sa.String(30), nullable=False, server_default="draft"
        ),
        sa.Column("docx_path", sa.String(512), nullable=True),
        sa.Column("docx_filename", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["application_id"], ["applications.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["job_lead_id"], ["job_leads.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_tailored_resumes_user_id"),
        "tailored_resumes",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_tailored_resumes_application_id"),
        "tailored_resumes",
        ["application_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_tailored_resumes_job_lead_id"),
        "tailored_resumes",
        ["job_lead_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_tailored_resumes_job_lead_id"), table_name="tailored_resumes"
    )
    op.drop_index(
        op.f("ix_tailored_resumes_application_id"), table_name="tailored_resumes"
    )
    op.drop_index(
        op.f("ix_tailored_resumes_user_id"), table_name="tailored_resumes"
    )
    op.drop_table("tailored_resumes")
