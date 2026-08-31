"""IMAP email sync helpers for recruitment notifications."""

from __future__ import annotations

import email
import imaplib
import re
import ssl
from dataclasses import dataclass
from datetime import datetime
from email.header import decode_header, make_header
from email.message import Message
from email.utils import parsedate_to_datetime

from starlette.concurrency import run_in_threadpool

from app.core.security import decrypt_api_key
from app.models import EmailSyncConfig

RECRUITMENT_KEYWORDS = [
    "面试",
    "笔试",
    "测评",
    "网申",
    "投递",
    "校招",
    "秋招",
    "录用",
    "offer",
    "interview",
    "assessment",
    "application",
    "recruit",
    "candidate",
]
IMAP_TIMEOUT_SECONDS = 20


@dataclass(slots=True)
class ParsedRecruitmentMail:
    message_id: str
    subject: str
    sender: str | None
    received_at: datetime | None
    snippet: str | None
    category: str
    company: str | None
    status: str | None
    application_url: str | None
    raw_metadata: dict


def _decode(value: str | None) -> str:
    if not value:
        return ""
    try:
        return str(make_header(decode_header(value)))
    except Exception:
        return value


def _message_text(message: Message) -> str:
    parts: list[str] = []
    if message.is_multipart():
        for part in message.walk():
            content_type = part.get_content_type()
            disposition = part.get_content_disposition()
            if disposition == "attachment" or content_type not in {
                "text/plain",
                "text/html",
            }:
                continue
            payload = part.get_payload(decode=True)
            if payload:
                charset = part.get_content_charset() or "utf-8"
                parts.append(payload.decode(charset, errors="ignore"))
    else:
        payload = message.get_payload(decode=True)
        if payload:
            charset = message.get_content_charset() or "utf-8"
            parts.append(payload.decode(charset, errors="ignore"))
    text = re.sub(r"<[^>]+>", " ", "\n".join(parts))
    text = re.sub(r"\s+", " ", text).strip()
    return text[:1000]


def _categorize(text: str) -> tuple[str, str | None]:
    lowered = text.lower()
    if any(keyword in lowered for keyword in ["offer", "录用", "意向书"]):
        return "offer", "offer"
    if any(keyword in lowered for keyword in ["面试", "interview"]):
        return "interview", "interview"
    if any(keyword in lowered for keyword in ["笔试", "测评", "assessment", "test"]):
        return "assessment", "assessment"
    if any(
        keyword in lowered
        for keyword in ["拒绝", "遗憾", "not move forward", "unfortunately"]
    ):
        return "rejection", "rejected"
    if any(keyword in lowered for keyword in ["投递", "申请", "application", "网申"]):
        return "application", "submitted"
    return "other", None


def _looks_recruitment_related(subject: str, body: str) -> bool:
    text = f"{subject}\n{body}".lower()
    return any(keyword.lower() in text for keyword in RECRUITMENT_KEYWORDS)


def _extract_url(text: str) -> str | None:
    match = re.search(r"https?://[^\s<>()]+", text)
    return match.group(0) if match else None


def _guess_company(subject: str, sender: str | None) -> str | None:
    for pattern in [r"【([^】]{2,40})】", r"\[([^\]]{2,40})\]"]:
        match = re.search(pattern, subject)
        if match:
            return match.group(1)
    if sender and "@" in sender:
        domain = sender.split("@", 1)[1].split(">", 1)[0]
        return domain.split(".")[0].title()
    return None


def _parse_message(raw: bytes) -> ParsedRecruitmentMail | None:
    message = email.message_from_bytes(raw)
    subject = _decode(message.get("Subject")) or "(no subject)"
    sender = _decode(message.get("From")) or None
    body = _message_text(message)
    if not _looks_recruitment_related(subject, body):
        return None
    category, status = _categorize(f"{subject}\n{body}")
    received_at = None
    if message.get("Date"):
        try:
            received_at = parsedate_to_datetime(message.get("Date"))
        except Exception:
            received_at = None
    message_id = message.get("Message-ID") or f"{subject}:{message.get('Date', '')}"
    return ParsedRecruitmentMail(
        message_id=message_id[:512],
        subject=subject[:500],
        sender=sender[:255] if sender else None,
        received_at=received_at,
        snippet=body[:500],
        category=category,
        company=_guess_company(subject, sender),
        status=status,
        application_url=_extract_url(body),
        raw_metadata={"date": message.get("Date"), "from": sender},
    )


def sync_imap_messages(
    config: EmailSyncConfig, limit: int = 50
) -> list[ParsedRecruitmentMail]:
    password = decrypt_api_key(config.encrypted_password or "")
    if not password:
        raise ValueError("Email password is not configured or cannot be decrypted")

    client_cls = imaplib.IMAP4_SSL if config.use_ssl else imaplib.IMAP4
    with client_cls(
        config.imap_host,
        config.imap_port,
        timeout=IMAP_TIMEOUT_SECONDS,
    ) as client:
        if not config.use_ssl:
            client.starttls(ssl_context=ssl.create_default_context())
        client.login(config.username, password)
        client.select("INBOX")
        _, data = client.search(None, "ALL")
        ids = (data[0] or b"").split()[-limit:]
        parsed: list[ParsedRecruitmentMail] = []
        for message_id in reversed(ids):
            _, message_data = client.fetch(message_id, "(RFC822)")
            if not message_data or not isinstance(message_data[0], tuple):
                continue
            parsed_mail = _parse_message(message_data[0][1])
            if parsed_mail:
                parsed.append(parsed_mail)
        return parsed


async def sync_imap_messages_async(
    config: EmailSyncConfig, limit: int = 50
) -> list[ParsedRecruitmentMail]:
    return await run_in_threadpool(sync_imap_messages, config, limit)
