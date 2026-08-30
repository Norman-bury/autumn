from typing import Any

from pydantic import BaseModel, Field


class ResumeParseResponse(BaseModel):
    """Response returned after uploading and parsing a resume."""

    profile: dict[str, Any]
    extracted_text_preview: str
    source: str = Field(description="Extraction strategy used: ai or heuristic")
