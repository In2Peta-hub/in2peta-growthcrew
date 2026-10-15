"""HTTP surface for GrowthCrew outreach. Mounted beside the social studio at /api/growthcrew."""

from __future__ import annotations

import re

from fastapi import APIRouter, File, Header, Request, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from config import CONFIG
from growthcrew.errors import GrowthcrewError
from growthcrew.normalize import normalize_csv_leads
from growthcrew import service

router = APIRouter(prefix="/api/growthcrew", tags=["GrowthCrew Outreach"])
RUN_SLUG = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_.~-]*$")


def _fail(status: int, error: str, code: str | None = None):
    payload = {"error": error}
    if code:
        payload["code"] = code
    return JSONResponse(status_code=status, content=payload)


def _guard(fn):
    try:
        return fn()
    except GrowthcrewError as exc:
        return _fail(exc.status, str(exc), exc.code)
    except Exception as exc:
        return _fail(400, str(exc) or "Request failed")


class AiPatch(BaseModel):
    provider: str | None = None
    model: str | None = None
    endpoint: str | None = None
    apiKey: str | None = None


class BrandPatch(BaseModel):
    name: str | None = None
    website: str | None = None
    offer: str | None = None
    serviceFocus: str | None = None
    cta: str | None = None


class EmailPatch(BaseModel):
    senderName: str | None = None
    template: str | None = None
    centralInbox: str | None = None
    physicalAddress: str | None = None
    unsubscribeUrl: str | None = None


class CampaignPatch(BaseModel):
    concurrency: int | None = None
    maxSendsPerInbox: int | None = None


class SendingPatch(BaseModel):
    mode: str | None = None


class SettingsPatch(BaseModel):
    ai: AiPatch | None = None
    brand: BrandPatch | None = None
    email: EmailPatch | None = None
    campaign: CampaignPatch | None = None
    sending: SendingPatch | None = None


class SearchBody(BaseModel):
    query: str = ""
    location: str = ""
    maxResults: int = 20


class LeadBody(BaseModel):
    id: str | int | None = None
    name: str = ""
    email: str
    company: str = ""
    title: str = ""
    phone: str | None = None
    address: str | None = None
    website: str | None = None
    city: str | None = None
    category: str | None = None
    rating: str | int | float | None = None
    reviewCount: str | int | float | None = None
    isBusinessEmail: bool | None = None
    raw: dict | None = None


class DraftCampaignBody(BaseModel):
    leads: list[LeadBody] = Field(min_length=1, max_length=1000)
    senderInboxIds: list[str] = Field(min_length=1, max_length=3)
    icp: str = ""
    productContext: str = ""
    senderName: str | None = None


class ApprovedDraft(LeadBody):
    senderInboxId: str
    subject: str
    body: str


class SendApprovedBody(BaseModel):
    drafts: list[ApprovedDraft] = Field(min_length=1, max_length=1000)
    campaignId: str | None = None


class SaveLeadsBody(BaseModel):
    leads: list[LeadBody] = Field(min_length=1, max_length=1000)
    source: str = "manual"


class DeleteManyBody(BaseModel):
    ids: list[str] = Field(min_length=1, max_length=1000)


class MessageBody(BaseModel):
    inboxId: str
    subject: str
    body: str


class DraftSendBody(BaseModel):
    lead: LeadBody
    inboxId: str
    subject: str
    body: str


class RelayBody(BaseModel):
    inboxIds: list[str] = Field(min_length=1, max_length=3)
    destination: str | None = None


class InboxBody(BaseModel):
    displayName: str | None = None
    username: str | None = None


class WebhookBody(BaseModel):
    url: str | None = None
    inboxIds: list[str] | None = None


def _lead(model: LeadBody) -> dict:
    return model.model_dump()


@router.get("/settings")
def get_settings():
    return service.public_settings(service.get_settings())


@router.put("/settings")
def put_settings(patch: SettingsPatch):
    return service.public_settings(service.save_settings(patch.model_dump(exclude_none=True)))


@router.post("/ai/test")
def test_ai():
    return _guard(lambda: {"success": True, "draft": service.test_provider()})


@router.get("/inboxes")
def inboxes():
    return _guard(service.list_inboxes)


@router.post("/inboxes")
def create_inbox(body: InboxBody):
    return _guard(lambda: service.create_inbox(body.displayName, body.username))


@router.post("/leads/search/start")
def search_start(body: SearchBody):
    if not body.query.strip() or not body.location.strip() or not 1 <= body.maxResults <= 100:
        return _fail(400, "A query, location, and lead count between 1 and 100 are required")
    result = _guard(lambda: service.start_search(body.query, body.location, body.maxResults))
    if isinstance(result, JSONResponse):
        return result
    return JSONResponse(status_code=202, content=result, headers={"Cache-Control": "no-store"})


@router.get("/leads/search/{run_slug}")
def search_status(run_slug: str):
    if not RUN_SLUG.match(run_slug):
        return _fail(400, "Invalid lead search ID")
    result = _guard(lambda: service.get_search(run_slug))
    if isinstance(result, JSONResponse):
        return result
    return JSONResponse(content=result, headers={"Cache-Control": "no-store"})


@router.post("/leads/search")
def search_sync(body: SearchBody):
    if not body.query.strip() or not body.location.strip() or not 1 <= body.maxResults <= 100:
        return _fail(400, "A query, location, and lead count between 1 and 100 are required")

    def run():
        result = service.search_leads(body.query, body.location, body.maxResults)
        return {**result, "count": len(result["leads"]), "verifiedEmails": len(result["leads"])}

    return _guard(run)


@router.get("/leads/database")
def lead_database():
    return _guard(service.lead_database_status)


@router.post("/leads/upload")
async def upload_csv(file: UploadFile | None = File(None)):
    if file is None:
        return _fail(400, "CSV file is required")
    raw = (await file.read()).decode("utf-8", errors="replace")
    leads = normalize_csv_leads(raw)
    return {"count": len(leads), "leads": leads}


@router.post("/campaigns/draft")
def draft_campaign(body: DraftCampaignBody):
    return _guard(lambda: service.draft_campaign(
        [_lead(lead) for lead in body.leads],
        body.senderInboxIds,
        body.icp,
        body.productContext,
        body.senderName,
    ))


@router.post("/campaigns/send-approved")
def send_approved(body: SendApprovedBody):
    return _guard(lambda: service.send_approved([_lead(draft) for draft in body.drafts], body.campaignId))


@router.post("/campaign/send")
def send_campaign(body: DraftCampaignBody):
    return _guard(lambda: service.send_campaign(
        [_lead(lead) for lead in body.leads],
        body.senderInboxIds,
        body.icp,
        body.productContext,
        body.senderName,
    ))


@router.post("/drafts/send")
def send_draft(body: DraftSendBody):
    return _guard(lambda: service.send_draft_message(_lead(body.lead), body.inboxId, body.subject, body.body))


@router.post("/drafts/send-approved")
def send_one_approved(body: ApprovedDraft):
    return _guard(lambda: service.send_draft_message(_lead(body), body.senderInboxId, body.subject, body.body))


@router.post("/leads/save")
def save_leads(body: SaveLeadsBody):
    saved = service.save_leads([_lead(lead) for lead in body.leads], body.source)
    return {"success": True, "count": len(saved)}


@router.get("/leads")
def leads():
    return service.list_leads()


@router.delete("/leads")
async def delete_many(request: Request):
    try:
        payload = await request.json()
    except Exception:
        payload = {}
    ids = payload.get("ids") if isinstance(payload, dict) else None
    if not isinstance(ids, list) or not ids or not all(isinstance(item, str) and item for item in ids):
        return _fail(400, "ids (non-empty string array) is required")
    return service.delete_leads(ids)


@router.get("/leads/{lead_id}/thread")
def thread(lead_id: str):
    found = service.get_thread(lead_id)
    if not found:
        return _fail(404, "Lead not found")
    return found


@router.delete("/leads/{lead_id}")
def delete_one(lead_id: str):
    return service.delete_lead(lead_id)


@router.post("/leads/{lead_id}/send")
def send_to_lead(lead_id: str, body: MessageBody):
    return _guard(lambda: service.send_lead_message(lead_id, body.inboxId, body.subject, body.body))


@router.post("/leads/{lead_id}/draft-reply")
def reply_draft(lead_id: str):
    return _guard(lambda: service.draft_reply(lead_id))


@router.post("/replies/relay")
def relay(body: RelayBody):
    settings = service.get_settings()
    destination = body.destination or settings["email"]["centralInbox"]
    forwarded = _guard(lambda: service.relay_replies(body.inboxIds, destination))
    if isinstance(forwarded, JSONResponse):
        return forwarded
    return {"success": True, "destination": destination, "count": len(forwarded), "forwarded": forwarded}


@router.post("/webhooks/register")
def register_webhook(body: WebhookBody):
    if not body.url or not body.inboxIds:
        return _fail(400, "url and inboxIds are required")
    return _guard(lambda: service.register_webhook(body.url, body.inboxIds))


@router.post("/webhooks/agentmail")
async def agentmail_webhook(request: Request, x_outreach_webhook_secret: str | None = Header(default=None)):
    if CONFIG.AGENTMAIL_WEBHOOK_SECRET and x_outreach_webhook_secret != CONFIG.AGENTMAIL_WEBHOOK_SECRET:
        return _fail(401, "Invalid webhook secret")
    try:
        event = await request.json()
    except Exception:
        event = {}
    if not isinstance(event, dict):
        event = {}
    data = event.get("data") or event.get("payload") or event
    if not isinstance(data, dict):
        data = {}
    event_type = str(event.get("type") or "")
    direction = str(data.get("direction") or data.get("folder") or data.get("status") or "").strip().lower()
    if "sent" in event_type or direction in ("outbound", "sent", "outgoing", "send", "delivered"):
        return {"success": True, "skipped": True}
    inbox_id = str(data.get("inbox_id") or data.get("inboxId") or "")
    message_id = str(data.get("message_id") or data.get("messageId") or data.get("id") or "")
    if not inbox_id or not message_id:
        return {"success": True, "skipped": True}
    settings = service.get_settings()
    if not settings["email"].get("centralInbox"):
        return _fail(400, "Central inbox is not configured")
    try:
        handled = service.handle_inbound_webhook(inbox_id, message_id, settings["email"]["centralInbox"])
    except Exception as exc:
        return _fail(400, str(exc))
    if not handled:
        return {"success": True, "skipped": True, "reason": "unknown-sender"}
    return {"success": True, "forwardedTo": settings["email"]["centralInbox"]}
