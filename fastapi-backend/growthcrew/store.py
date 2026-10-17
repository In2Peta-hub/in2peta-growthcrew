"""JSON persistence for GrowthCrew outreach. Replaces the platform Prisma tables."""

from __future__ import annotations

import threading
import uuid
from datetime import datetime, timezone
from typing import Any

from storage import JsonStore

_LOCK = threading.RLock()
_STORE = JsonStore(
    "outreach.json",
    {"settings": None, "leads": [], "messages": []},
    env_var="OUTREACH_DATA_FILE",
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _read() -> dict[str, Any]:
    return _STORE.read()


def _write(data: dict[str, Any]) -> None:
    _STORE.write(data)


def load() -> dict[str, Any]:
    with _LOCK:
        return _read()


def save_settings_row(row: dict[str, Any]) -> dict[str, Any]:
    with _LOCK:
        data = _read()
        row = {**row, "id": "default", "updatedAt": _now()}
        data["settings"] = row
        _write(data)
        return row


def get_settings_row() -> dict[str, Any] | None:
    with _LOCK:
        return _read().get("settings")


def upsert_lead(email: str, row: dict[str, Any], *, status: str | None = None) -> dict[str, Any]:
    with _LOCK:
        data = _read()
        existing = next((lead for lead in data["leads"] if lead.get("email") == email), None)
        now = _now()
        if existing:
            existing.update(row)
            existing["email"] = email
            existing["updatedAt"] = now
            if status:
                existing["status"] = status
            _write(data)
            return existing
        created = {
            "id": uuid.uuid4().hex,
            "replyCount": 0,
            "lastReplyAt": None,
            "lastInboxId": "",
            "lastSubject": "",
            "createdAt": now,
            "updatedAt": now,
            "status": status or "SAVED",
            **row,
            "email": email,
        }
        data["leads"].insert(0, created)
        _write(data)
        return created


def list_leads() -> list[dict[str, Any]]:
    with _LOCK:
        data = _read()
        counts: dict[str, int] = {}
        for message in data["messages"]:
            counts[message["leadId"]] = counts.get(message["leadId"], 0) + 1
        leads = sorted(data["leads"], key=lambda lead: lead.get("updatedAt") or "", reverse=True)
        return [{**lead, "messageCount": counts.get(lead["id"], 0)} for lead in leads]


def get_lead(lead_id: str) -> dict[str, Any] | None:
    with _LOCK:
        return next((lead for lead in _read()["leads"] if lead.get("id") == lead_id), None)


def get_lead_by_email(email: str) -> dict[str, Any] | None:
    with _LOCK:
        return next((lead for lead in _read()["leads"] if lead.get("email") == email), None)


def delete_leads(ids: list[str]) -> int:
    unique = list(dict.fromkeys(item.strip() for item in ids if item and item.strip()))
    if not unique:
        return 0
    with _LOCK:
        data = _read()
        before = len(data["leads"])
        id_set = set(unique)
        data["leads"] = [lead for lead in data["leads"] if lead.get("id") not in id_set]
        data["messages"] = [message for message in data["messages"] if message.get("leadId") not in id_set]
        _write(data)
        return before - len(data["leads"])


def delete_lead(lead_id: str) -> bool:
    with _LOCK:
        data = _read()
        before = len(data["leads"])
        data["leads"] = [lead for lead in data["leads"] if lead.get("id") != lead_id]
        data["messages"] = [message for message in data["messages"] if message.get("leadId") != lead_id]
        removed = len(data["leads"]) != before
        if removed:
            _write(data)
        return removed


def list_messages(lead_id: str) -> list[dict[str, Any]]:
    with _LOCK:
        messages = [message for message in _read()["messages"] if message.get("leadId") == lead_id]
        return sorted(messages, key=lambda message: message.get("createdAt") or "")


def find_message_by_provider(provider_message_id: str) -> dict[str, Any] | None:
    with _LOCK:
        return next((message for message in _read()["messages"] if message.get("providerMessageId") == provider_message_id), None)


def add_message(lead_id: str, *, direction: str, subject: str, body: str, inbox_id: str, provider_message_id: str = "") -> dict[str, Any]:
    with _LOCK:
        data = _read()
        message = {
            "id": uuid.uuid4().hex,
            "leadId": lead_id,
            "direction": direction,
            "subject": subject,
            "body": body,
            "inboxId": inbox_id,
            "providerMessageId": provider_message_id,
            "createdAt": _now(),
        }
        data["messages"].append(message)
        _write(data)
        return message


def mark_replied(lead_id: str) -> dict[str, Any] | None:
    with _LOCK:
        data = _read()
        lead = next((item for item in data["leads"] if item.get("id") == lead_id), None)
        if not lead:
            return None
        lead["status"] = "REPLIED"
        lead["replyCount"] = int(lead.get("replyCount") or 0) + 1
        lead["lastReplyAt"] = _now()
        lead["updatedAt"] = lead["lastReplyAt"]
        _write(data)
        return lead
