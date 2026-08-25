import uuid
from datetime import UTC, date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.services.export_registry import exportable


@exportable(order=9)
class CompanyPortal(Base):
    __tablename__ = "company_portals"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    company_type: Mapped[str] = mapped_column(String(50), nullable=False)
    company_scale: Mapped[str] = mapped_column(String(50), nullable=False)
    industry: Mapped[str] = mapped_column(String(100), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    careers_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    campus_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    focus_roles: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    recruitment_cycle: Mapped[str] = mapped_column(
        String(50), nullable=False, default="2027届秋招"
    )
    recruitment_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="open"
    )
    application_deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    verification_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="verified"
    )
    verified_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    evidence_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    user = relationship("User", back_populates="company_portals")


Index(
    "ix_company_portals_city_scale",
    CompanyPortal.city,
    CompanyPortal.company_scale,
)
Index(
    "uq_company_portals_global_name",
    CompanyPortal.company_name,
    unique=True,
    sqlite_where=CompanyPortal.user_id.is_(None),
    postgresql_where=CompanyPortal.user_id.is_(None),
)
Index(
    "uq_company_portals_user_name",
    CompanyPortal.user_id,
    CompanyPortal.company_name,
    unique=True,
    sqlite_where=CompanyPortal.user_id.is_not(None),
    postgresql_where=CompanyPortal.user_id.is_not(None),
)
