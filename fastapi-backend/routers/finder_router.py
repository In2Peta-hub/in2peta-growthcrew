"""HTTP surface for the GrowthCrew lead finder (docs/lead-finder-spec.md §3).

Mounted at /api/finder. All JSON. Authenticated calls send
``X-Finder-Token: <token>``; the server keeps only a SHA-256 of the token.
"""

from __future__ import annotations

import hmac
from typing import Literal

from fastapi import APIRouter, Header, Request
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

from config import CONFIG
from growthcrew import finder, finder_store
from growthcrew.errors import GrowthcrewError

router = APIRouter(prefix="/api/finder", tags=["GrowthCrew Lead Finder"])

PREVIEW_RATE_LIMIT = 6
SESSION_RATE_LIMIT = 5


def _client_ip(request: Request) -> str:
    return request.client.host if request.client and request.client.host else "unknown"


def _json(status: int, payload: dict) -> JSONResponse:
    return JSONResponse(status_code=status, content=payload, headers={"Cache-Control": "no-store"})


def _require_account(request: Request) -> dict:
    supplied = request.headers.get("X-Finder-Token") or ""
    account = finder.account_for_token(supplied)
    if not account:
        raise GrowthcrewError("Sign in to continue.", 401, "UNAUTHORIZED")
    return account


class PreviewBody(BaseModel):
    describe: str = Field(min_length=3, max_length=200)
    website: str | None = Field(default=None, max_length=300)


class AccountBody(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    previewId: str | None = None


class SessionBody(BaseModel):
    email: str = Field(min_length=3, max_length=254)


class VerifyBody(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    code: str = Field(min_length=4, max_length=200)


class DecisionBody(BaseModel):
    decision: Literal["keep", "skip", "undo"]


class MessageBody(BaseModel):
    subject: str = Field(max_length=200)
    body: str = Field(max_length=5000)


class RefineBody(BaseModel):
    who: str | None = Field(default=None, max_length=120)
    where: str | None = Field(default=None, max_length=120)
    runsTheCompany: bool | None = None


class BatchBody(BaseModel):
    count: int = Field(default=10, ge=1, le=25)
    refine: RefineBody | None = None


class OfferBody(BaseModel):
    offer: str = Field(min_length=3, max_length=200)


class AutopilotBody(BaseModel):
    enabled: bool
    count: int | None = Field(default=None, ge=5, le=25)


# --- previews ---------------------------------------------------------------


@router.post("/previews")
def create_preview(body: PreviewBody, request: Request):
    if not finder.allow_request("previews", _client_ip(request), PREVIEW_RATE_LIMIT):
        raise GrowthcrewError(
            "Too many searches from this address. Try again in a little while.",
            429,
            "RATE_LIMITED",
        )
    preview_id = finder.start_preview(body.describe, body.website)
    return _json(202, {"previewId": preview_id, "status": "running"})


@router.get("/previews/{preview_id}")
def get_preview(preview_id: str):
    payload = finder.preview_payload(preview_id)
    if not payload:
        raise GrowthcrewError("Preview not found.", 404, "PREVIEW_NOT_FOUND")
    return _json(200, payload)


# --- accounts and sessions --------------------------------------------------


@router.post("/accounts")
def create_account(body: AccountBody, request: Request):
    if not finder.allow_request("accounts", _client_ip(request), SESSION_RATE_LIMIT):
        raise GrowthcrewError("Too many sign-ups from this address. Try again in a little while.", 429, "RATE_LIMITED")
    result = finder.create_account(body.email, body.previewId)
    return _json(201, result)


@router.post("/sessions")
def create_session(body: SessionBody, request: Request):
    if not finder.allow_request("sessions", _client_ip(request), SESSION_RATE_LIMIT):
        raise GrowthcrewError(
            "Too many sign-in emails from this address. Try again in a little while.",
            429,
            "RATE_LIMITED",
        )
    finder.request_sign_in(body.email, _client_ip(request))
    # Always the same answer: no way to test whether an account exists.
    return _json(202, {"sent": True})


@router.post("/sessions/verify")
def verify_session(body: VerifyBody):
    return finder.verify_sign_in(body.email, body.code)


@router.get("/me")
def me(request: Request):
    account = _require_account(request)
    return {"account": finder.public_account(account)}


@router.put("/me")
def update_me(body: OfferBody, request: Request):
    account = _require_account(request)
    return finder.set_offer(account["email"], body.offer)


# --- leads ------------------------------------------------------------------


@router.get("/leads")
def leads(request: Request, status: str = "all"):
    account = _require_account(request)
    if status not in ("pending", "kept", "skipped", "all"):
        raise GrowthcrewError("That view of your list does not exist. Reload the page.", 400, "INVALID_STATUS")
    return {"leads": finder.list_leads(account["email"], status)}


@router.post("/leads/{key}/decision")
def decide(key: str, body: DecisionBody, request: Request):
    account = _require_account(request)
    return finder.decide(account["email"], key, body.decision)


@router.put("/leads/{key}/message")
def save_message(key: str, body: MessageBody, request: Request):
    account = _require_account(request)
    return finder.save_message(account["email"], key, body.subject, body.body)


# --- batches ----------------------------------------------------------------


@router.post("/batches")
def start_batch(body: BatchBody, request: Request):
    account = _require_account(request)
    refine = body.refine.model_dump(exclude_none=True) if body.refine else None
    batch_id = finder.start_batch(account["email"], body.count, refine)
    return _json(202, {"batchId": batch_id})


@router.get("/batches/{batch_id}")
def get_batch(batch_id: str, request: Request):
    account = _require_account(request)
    return finder.batch_payload(account["email"], batch_id)


# --- autopilot, export, digest ---------------------------------------------


@router.put("/autopilot")
def set_autopilot(body: AutopilotBody, request: Request):
    account = _require_account(request)
    return finder.set_autopilot(account["email"], body.enabled, body.count)


@router.get("/export.csv")
def export_csv(request: Request):
    # Header auth only: a ?token= query string would end up in access logs.
    account = _require_account(request)
    kept = [lead for lead in finder_store.list_leads(account["email"]) if lead.get("status") == "kept"]
    csv_text = finder.export_csv(kept)
    return Response(
        content=csv_text,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="growthcrew-leads.csv"',
            "Cache-Control": "no-store",
        },
    )


@router.post("/digests/run")
def run_digests(
    request: Request,
    x_digest_secret: str | None = Header(default=None),
):
    secret = CONFIG.FINDER_DIGEST_SECRET
    if secret:
        if not x_digest_secret or not hmac.compare_digest(x_digest_secret, secret):
            raise GrowthcrewError("Invalid digest secret.", 401, "UNAUTHORIZED")
    elif not finder.is_local_host(_client_ip(request)):
        raise GrowthcrewError("This endpoint is limited to localhost.", 403, "FORBIDDEN")
    return finder.run_due_digests()
