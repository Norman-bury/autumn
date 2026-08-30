from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class EmailSyncConfigUpdate(BaseModel):
    provider: str = Field(default="imap", max_length=50)
    imap_host: str = Field(..., max_length=255)
    imap_port: int = Field(default=993, ge=1, le=65535)
    username: str = Field(..., max_length=255)
    password: str | None = Field(default=None, description="IMAP app password")
    use_ssl: bool = True
    enabled: bool = True


class EmailSyncConfigResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    provider: str
    imap_host: str
    imap_port: int
    username: str
    use_ssl: bool
    enabled: bool
    has_password: bool
    last_sync_at: datetime | None


class RecruitmentMailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    message_id: str
    subject: str
    sender: str | None
    received_at: datetime | None
    snippet: str | None
    category: str
    company: str | None
    status: str | None
    application_url: str | None
    raw_metadata: dict[str, Any] | None
    created_at: datetime


class EmailSyncResult(BaseModel):
    imported: int
    skipped: int
    messages: list[RecruitmentMailResponse]
