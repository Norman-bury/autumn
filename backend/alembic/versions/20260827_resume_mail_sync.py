"""add resume profile and mail sync fields

Revision ID: 20260827_resume_mail_sync
Revises: 20260822_portal_verification
Create Date: 2026-08-27 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260827_resume_mail_sync"
down_revision: str | Sequence[str] | None = "20260822_portal_verification"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("user_profiles", sa.Column("github_url", sa.String(512), nullable=True))
    op.add_column(
        "user_profiles", sa.Column("portfolio_url", sa.String(512), nullable=True)
    )
    op.add_column(
        "user_profiles", sa.Column("highest_degree", sa.String(100), nullable=True)
    )
    op.add_column(
        "user_profiles", sa.Column("graduation_year", sa.String(20), nullable=True)
    )
    op.add_column("user_profiles", sa.Column("target_roles", sa.JSON(), nullable=True))
    op.add_column(
        "user_profiles", sa.Column("preferred_locations", sa.JSON(), nullable=True)
    )
    op.add_column(
        "user_profiles", sa.Column("expected_salary", sa.String(100), nullable=True)
    )
    op.add_column("user_profiles", sa.Column("projects", sa.JSON(), nullable=True))
    op.add_column("user_profiles", sa.Column("certificates", sa.JSON(), nullable=True))
    op.add_column("user_profiles", sa.Column("languages", sa.JSON(), nullable=True))
    op.add_column("user_profiles", sa.Column("self_summary", sa.Text(), nullable=True))
    op.add_column(
        "user_profiles", sa.Column("resume_file_path", sa.String(512), nullable=True)
    )
    op.add_column(
        "user_profiles",
        sa.Column("resume_original_filename", sa.String(255), nullable=True),
    )
    op.add_column("user_profiles", sa.Column("resume_text", sa.Text(), nullable=True))
    op.add_column(
        "user_profiles", sa.Column("resume_parsed_at", sa.DateTime(timezone=True), nullable=True)
    )

    op.create_table(
        "email_sync_configs",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("imap_host", sa.String(255), nullable=False),
        sa.Column("imap_port", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(255), nullable=False),
        sa.Column("encrypted_password", sa.Text(), nullable=True),
        sa.Column("use_ssl", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("last_sync_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_email_sync_configs_user_id"),
        "email_sync_configs",
        ["user_id"],
        unique=True,
    )
    op.create_table(
        "recruitment_mails",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("message_id", sa.String(512), nullable=False),
        sa.Column("subject", sa.String(500), nullable=False),
        sa.Column("sender", sa.String(255), nullable=True),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("snippet", sa.Text(), nullable=True),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("company", sa.String(255), nullable=True),
        sa.Column("status", sa.String(50), nullable=True),
        sa.Column("application_url", sa.String(2048), nullable=True),
        sa.Column("raw_metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "message_id", name="uq_recruitment_mails_user_message"),
    )
    op.create_index(
        op.f("ix_recruitment_mails_user_id"),
        "recruitment_mails",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_recruitment_mails_user_id"), table_name="recruitment_mails")
    op.drop_table("recruitment_mails")
    op.drop_index(
        op.f("ix_email_sync_configs_user_id"), table_name="email_sync_configs"
    )
    op.drop_table("email_sync_configs")

    op.drop_column("user_profiles", "resume_parsed_at")
    op.drop_column("user_profiles", "resume_text")
    op.drop_column("user_profiles", "resume_original_filename")
    op.drop_column("user_profiles", "resume_file_path")
    op.drop_column("user_profiles", "self_summary")
    op.drop_column("user_profiles", "languages")
    op.drop_column("user_profiles", "certificates")
    op.drop_column("user_profiles", "projects")
    op.drop_column("user_profiles", "expected_salary")
    op.drop_column("user_profiles", "preferred_locations")
    op.drop_column("user_profiles", "target_roles")
    op.drop_column("user_profiles", "graduation_year")
    op.drop_column("user_profiles", "highest_degree")
    op.drop_column("user_profiles", "portfolio_url")
    op.drop_column("user_profiles", "github_url")
