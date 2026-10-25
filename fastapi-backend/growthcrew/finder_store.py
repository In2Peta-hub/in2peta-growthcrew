"""JSON persistence for the GrowthCrew lead finder.

One document, guarded by a lock, written through ``storage.JsonStore`` exactly
like ``growthcrew/store.py``. The file can be moved with ``FINDER_DATA_FILE``.

Shape::

    {
      "accounts": { "<email>": {account record} },
      "leads":    { "<lead key>": {lead record, includes "account"} },
      "tokens":   { "<sha256 hex>": {email, createdAt} },
      "codes":    { "<email>": {codeHash, expiresAt, used} },
      "batches":  { "<batchId>": {batch record, includes "account"} }
    }

Tokens and sign-in codes are stored as SHA-256 hex only. The comparison itself
uses ``hmac.compare_digest`` in ``find_account_by_token_hash``.
"""

from __future__ import annotations

import hmac
import threading
from typing import Any

from storage import JsonStore

_LOCK = threading.RLock()
_STORE = JsonStore(
    "finder.json",
    {"accounts": {}, "leads": {}, "tokens": {}, "codes": {}, "batches": {}},
    env_var="FINDER_DATA_FILE",
)


def _read() -> dict[str, Any]:
    return _STORE.read()


def _write(data: dict[str, Any]) -> dict[str, Any]:
    return _STORE.write(data)


# --- accounts ---------------------------------------------------------------


def load() -> dict[str, Any]:
    with _LOCK:
        return _read()


def get_account(email: str) -> dict[str, Any] | None:
    with _LOCK:
        return _read()["accounts"].get((email or "").strip().lower())


def list_accounts() -> list[dict[str, Any]]:
    with _LOCK:
        return list(_read()["accounts"].values())


def save_account(account: dict[str, Any]) -> dict[str, Any]:
    email = str(account.get("email") or "").strip().lower()
    with _LOCK:
        data = _read()
        data["accounts"][email] = {**account, "email": email}
        _write(data)
        return data["accounts"][email]


# --- tokens -----------------------------------------------------------------


def save_token(token_hash: str, email: str) -> None:
    with _LOCK:
        data = _read()
        data["tokens"][token_hash] = {"email": email.strip().lower()}
        _write(data)


def find_account_by_token_hash(token_hash: str) -> dict[str, Any] | None:
    if not token_hash:
        return None
    with _LOCK:
        data = _read()
        for stored_hash, record in data["tokens"].items():
            if hmac.compare_digest(str(stored_hash), str(token_hash)):
                return data["accounts"].get(str(record.get("email") or ""))
    return None


def revoke_token(token_hash: str) -> None:
    with _LOCK:
        data = _read()
        if data["tokens"].pop(token_hash, None) is not None:
            _write(data)


# --- sign-in codes ----------------------------------------------------------


def save_code(email: str, code_hash: str, expires_at: str) -> None:
    with _LOCK:
        data = _read()
        data["codes"][email.strip().lower()] = {
            "codeHash": code_hash,
            "expiresAt": expires_at,
            "used": False,
        }
        _write(data)


def get_code(email: str) -> dict[str, Any] | None:
    with _LOCK:
        return _read()["codes"].get((email or "").strip().lower())


def mark_code_used(email: str) -> None:
    with _LOCK:
        data = _read()
        record = data["codes"].get((email or "").strip().lower())
        if record:
            record["used"] = True
            _write(data)


# --- leads ------------------------------------------------------------------


def get_lead(key: str) -> dict[str, Any] | None:
    with _LOCK:
        return _read()["leads"].get(key)


def save_lead(lead: dict[str, Any]) -> dict[str, Any]:
    key = str(lead.get("key") or "")
    with _LOCK:
        data = _read()
        data["leads"][key] = dict(lead)
        _write(data)
        return data["leads"][key]


def list_leads(account_email: str) -> list[dict[str, Any]]:
    email = (account_email or "").strip().lower()
    with _LOCK:
        return [lead for lead in _read()["leads"].values() if lead.get("account") == email]


# --- batches ----------------------------------------------------------------


def save_batch(batch: dict[str, Any]) -> dict[str, Any]:
    batch_id = str(batch.get("batchId") or "")
    with _LOCK:
        data = _read()
        data["batches"][batch_id] = dict(batch)
        _write(data)
        return data["batches"][batch_id]


def get_batch(batch_id: str) -> dict[str, Any] | None:
    with _LOCK:
        return _read()["batches"].get((batch_id or "").strip())


def list_batches(account_email: str) -> list[dict[str, Any]]:
    email = (account_email or "").strip().lower()
    with _LOCK:
        return [batch for batch in _read()["batches"].values() if batch.get("account") == email]
