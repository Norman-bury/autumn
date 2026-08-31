from app.models import EmailSyncConfig
from app.services import email_sync


class FakeIMAPClient:
    events: list[tuple] = []

    def __init__(self, host: str, port: int, *, timeout: int):
        self.events.append(("connect", host, port, timeout))

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False

    def starttls(self, *, ssl_context):
        self.events.append(("starttls", ssl_context))
        return "OK", [b"Begin TLS"]

    def login(self, username: str, password: str):
        self.events.append(("login", username, password))
        return "OK", [b"Logged in"]

    def select(self, mailbox: str):
        self.events.append(("select", mailbox))
        return "OK", [b"0"]

    def search(self, charset, criterion: str):
        self.events.append(("search", charset, criterion))
        return "OK", [b""]


def make_config(*, use_ssl: bool) -> EmailSyncConfig:
    return EmailSyncConfig(
        user_id="user-1",
        imap_host="imap.example.com",
        imap_port=993 if use_ssl else 143,
        username="candidate@example.com",
        encrypted_password="encrypted",
        use_ssl=use_ssl,
        enabled=True,
    )


def test_plain_imap_upgrades_to_tls_before_login(monkeypatch):
    FakeIMAPClient.events = []
    tls_context = object()
    monkeypatch.setattr(email_sync, "decrypt_api_key", lambda _: "secret")
    monkeypatch.setattr(email_sync.imaplib, "IMAP4", FakeIMAPClient)
    monkeypatch.setattr(email_sync.ssl, "create_default_context", lambda: tls_context)

    assert email_sync.sync_imap_messages(make_config(use_ssl=False)) == []

    assert FakeIMAPClient.events[:3] == [
        ("connect", "imap.example.com", 143, email_sync.IMAP_TIMEOUT_SECONDS),
        ("starttls", tls_context),
        ("login", "candidate@example.com", "secret"),
    ]


def test_ssl_imap_uses_connection_timeout_without_starttls(monkeypatch):
    FakeIMAPClient.events = []
    monkeypatch.setattr(email_sync, "decrypt_api_key", lambda _: "secret")
    monkeypatch.setattr(email_sync.imaplib, "IMAP4_SSL", FakeIMAPClient)

    assert email_sync.sync_imap_messages(make_config(use_ssl=True)) == []

    assert FakeIMAPClient.events[0] == (
        "connect",
        "imap.example.com",
        993,
        email_sync.IMAP_TIMEOUT_SECONDS,
    )
    assert all(event[0] != "starttls" for event in FakeIMAPClient.events)
