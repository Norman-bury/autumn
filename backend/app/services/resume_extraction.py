"""Resume parsing and profile extraction helpers."""

from __future__ import annotations

import io
import json
import logging
import re
from typing import Any

import openai
from litellm import completion
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from app.services.extraction import (
    DEFAULT_EXTRACTION_MODEL,
    ExtractionAuthError,
    ExtractionInvalidResponseError,
    ExtractionTimeoutError,
)

logger = logging.getLogger(__name__)

MAX_RESUME_TEXT_SIZE = 30_000


class ResumeProfileExtraction(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    city: str | None = None
    country: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None
    highest_degree: str | None = None
    graduation_year: str | None = None
    target_roles: list[str] | None = None
    preferred_locations: list[str] | None = None
    expected_salary: str | None = None
    work_history: list[dict[str, Any]] | None = None
    education: list[dict[str, Any]] | None = None
    skills: list[str] | None = None
    projects: list[dict[str, Any]] | None = None
    certificates: list[str] | None = None
    languages: list[str] | None = None
    self_summary: str | None = Field(
        None, description="Short candidate summary suitable for application forms"
    )


RESUME_EXTRACTION_SYSTEM_PROMPT = """You are a resume parser for a job application tracker. Extract structured candidate profile data from the resume text and return ONLY a valid JSON object.

Return these fields exactly:
- first_name, last_name, email, phone, location, city, country
- linkedin_url, github_url, portfolio_url
- highest_degree, graduation_year
- target_roles: array of target job titles inferred from the resume
- preferred_locations: array of preferred locations if explicitly present
- expected_salary: string or null
- work_history: array of objects with company, title, start_date, end_date, location, description, highlights
- education: array of objects with institution, degree, field_of_study, start_date, end_date, gpa
- skills: array of concise skills, including technical skills and tools
- projects: array of objects with name, role, start_date, end_date, description, technologies, highlights
- certificates: array of certificates, awards, honors, publications, competitions
- languages: array of spoken or programming languages if present
- self_summary: 2-4 sentence concise Chinese summary for online applications

Rules:
1. Preserve facts from the resume; do not invent companies, schools, dates, degrees, or awards.
2. If a field is missing, use null; if a list is missing, use an empty array.
3. Keep descriptions concise but useful for autofill.
4. Return only JSON, without markdown or comments."""


def extract_resume_text_from_pdf(content: bytes) -> str:
    """Extract text from a PDF resume using pypdf."""
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise ExtractionInvalidResponseError(
            "PDF parser dependency pypdf is not installed. Please install backend dependencies."
        ) from exc

    try:
        reader = PdfReader(io.BytesIO(content))
        parts: list[str] = []
        for page in reader.pages:
            page_text = page.extract_text() or ""
            if page_text.strip():
                parts.append(page_text)
    except Exception as exc:
        raise ExtractionInvalidResponseError(f"Failed to read PDF resume: {exc}") from exc

    text = _clean_text("\n\n".join(parts))
    if not text:
        raise ExtractionInvalidResponseError(
            "No selectable text found in the PDF. Please use a text-based resume PDF."
        )
    return text[:MAX_RESUME_TEXT_SIZE]


def _clean_text(text: str) -> str:
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _unique(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        normalized = item.strip(" ，,;；")
        key = normalized.lower()
        if normalized and key not in seen:
            seen.add(key)
            result.append(normalized)
    return result


def extract_resume_profile_heuristic(text: str) -> ResumeProfileExtraction:
    """Best-effort local extraction used when AI settings are not configured."""
    email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
    phone_match = re.search(r"(?:\+?86[-\s]?)?(1[3-9]\d[-\s]?\d{4}[-\s]?\d{4})", text)
    url_matches = re.findall(r"https?://[^\s)）]+", text)

    first_name = None
    last_name = None
    for line in text.splitlines()[:8]:
        candidate = line.strip()
        if 2 <= len(candidate) <= 12 and not re.search(r"[@\d:/]", candidate):
            if re.search(r"[\u4e00-\u9fff]", candidate):
                first_name = candidate
                last_name = None
            else:
                parts = candidate.split()
                if len(parts) >= 2:
                    first_name, last_name = parts[0], " ".join(parts[1:])
            break

    skill_keywords = [
        "Python",
        "Java",
        "Go",
        "C++",
        "JavaScript",
        "TypeScript",
        "React",
        "Vue",
        "FastAPI",
        "Flask",
        "Django",
        "Spring",
        "SQL",
        "MySQL",
        "PostgreSQL",
        "Redis",
        "Docker",
        "Kubernetes",
        "Linux",
        "PyTorch",
        "TensorFlow",
        "LLM",
        "RAG",
        "Agent",
        "LangChain",
        "大模型",
        "机器学习",
        "深度学习",
    ]
    skills = _unique([skill for skill in skill_keywords if re.search(skill, text, re.I)])

    degree = None
    if re.search(r"硕士|研究生|Master", text, re.I):
        degree = "硕士"
    elif re.search(r"本科|Bachelor", text, re.I):
        degree = "本科"

    graduation_match = re.search(r"(20\d{2})\s*(?:年)?\s*(?:毕业|届)", text)

    return ResumeProfileExtraction(
        first_name=first_name,
        last_name=last_name,
        email=email_match.group(0) if email_match else None,
        phone=phone_match.group(1).replace(" ", "").replace("-", "")
        if phone_match
        else None,
        linkedin_url=next((url for url in url_matches if "linkedin" in url.lower()), None),
        github_url=next((url for url in url_matches if "github" in url.lower()), None),
        portfolio_url=next(
            (
                url
                for url in url_matches
                if "linkedin" not in url.lower() and "github" not in url.lower()
            ),
            None,
        ),
        highest_degree=degree,
        graduation_year=graduation_match.group(1) if graduation_match else None,
        skills=skills,
        target_roles=["大模型算法工程师", "AI 应用开发工程师"]
        if re.search(r"大模型|LLM|RAG|Agent", text, re.I)
        else None,
        self_summary=text[:500],
    )


def extract_resume_profile_with_llm(
    text: str,
    model: str | None = None,
    api_key: str | None = None,
    api_base: str | None = None,
    timeout: int = 60,
) -> ResumeProfileExtraction:
    """Extract structured resume profile data with LiteLLM."""
    import os

    if not api_key:
        raise ExtractionAuthError("AI API key not configured")

    extraction_model = model or os.getenv("LITELLM_MODEL", DEFAULT_EXTRACTION_MODEL)
    completion_kwargs: dict[str, Any] = {
        "model": extraction_model,
        "messages": [
            {"role": "system", "content": RESUME_EXTRACTION_SYSTEM_PROMPT},
            {"role": "user", "content": f"Resume text:\n{text[:MAX_RESUME_TEXT_SIZE]}"},
        ],
        "response_format": {"type": "json_object"},
        "timeout": timeout,
    }
    if api_key:
        completion_kwargs["api_key"] = api_key
    if api_base:
        completion_kwargs["api_base"] = api_base

    try:
        response = completion(**completion_kwargs)
        raw_content = response.choices[0].message.content  # type: ignore[union-attr]
        if not raw_content:
            raise ExtractionInvalidResponseError("LLM returned empty resume response")
        return ResumeProfileExtraction(**json.loads(raw_content))
    except openai.APITimeoutError as exc:
        raise ExtractionTimeoutError("Resume extraction timed out") from exc
    except openai.AuthenticationError as exc:
        raise ExtractionAuthError("AI API key is invalid or expired") from exc
    except json.JSONDecodeError as exc:
        raise ExtractionInvalidResponseError(
            f"Failed to parse resume extraction JSON: {exc}"
        ) from exc
    except Exception as exc:
        if isinstance(
            exc,
            (ExtractionAuthError, ExtractionInvalidResponseError, ExtractionTimeoutError),
        ):
            raise
        raise ExtractionInvalidResponseError(f"Resume extraction failed: {exc}") from exc


async def extract_resume_profile_with_llm_async(
    text: str,
    model: str | None = None,
    api_key: str | None = None,
    api_base: str | None = None,
    timeout: int = 60,
) -> ResumeProfileExtraction:
    return await run_in_threadpool(
        extract_resume_profile_with_llm,
        text,
        model,
        api_key,
        api_base,
        timeout,
    )
