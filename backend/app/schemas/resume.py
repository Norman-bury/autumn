from pydantic import BaseModel, Field

from app.schemas.user_profile import UserProfileResponse


class ResumeParseResponse(BaseModel):
    """Response returned after uploading and parsing a resume."""

    profile: UserProfileResponse
    extracted_text_preview: str
    source: str = Field(description="Extraction strategy used: ai or heuristic")
