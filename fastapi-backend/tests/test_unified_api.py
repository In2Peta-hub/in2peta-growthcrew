"""Wiring tests for the unified backend: one app, one error envelope, one data layer."""

import asyncio
import json
import os
import tempfile
from pathlib import Path

os.environ.setdefault("OUTREACH_DATA_FILE", tempfile.mktemp(suffix=".json"))

from fastapi import HTTPException
from fastapi.exceptions import RequestValidationError

from main import app, http_error_handler, validation_error_handler
from storage import JsonStore


def _body(response) -> dict:
    return json.loads(response.body)


def test_single_app_serves_both_surfaces():
    paths = set(app.openapi()["paths"])
    assert "/api/health" in paths  # social studio
    assert "/api/growthcrew/settings" in paths  # lead-gen outreach


def test_http_errors_use_the_unified_envelope():
    response = asyncio.run(http_error_handler(None, HTTPException(status_code=404, detail="Lead not found")))
    assert response.status_code == 404
    assert _body(response) == {
        "error": "Lead not found",
        "code": "HTTP_ERROR",
        "detail": "Lead not found",
    }


def test_validation_errors_use_the_unified_envelope():
    error = RequestValidationError([{"type": "missing", "loc": ("body", "email"), "msg": "Field required"}])
    response = asyncio.run(validation_error_handler(None, error))
    assert response.status_code == 422
    payload = _body(response)
    assert payload["code"] == "VALIDATION_ERROR"
    assert payload["error"] == "Validation error"
    assert payload["detail"][0]["loc"] == ["body", "email"]


def test_json_store_round_trip_and_defaults():
    store = JsonStore("unused.json", {"settings": None, "leads": []})
    store.path = Path(tempfile.mktemp(suffix=".json"))

    # Missing file -> defaults, deep-copied so callers can mutate freely.
    first = store.read()
    assert first == {"settings": None, "leads": []}
    first["leads"].append({"email": "a@b.co"})
    assert store.read()["leads"] == []

    store.write({"leads": [{"email": "lead@example.com"}]})
    assert store.read()["leads"][0]["email"] == "lead@example.com"
    # Defaults are backfilled on read.
    assert store.read()["settings"] is None
