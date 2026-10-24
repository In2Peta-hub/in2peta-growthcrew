"""GrowthCrew outreach service. Behavior matches the Fastify module; persistence is local JSON."""

from __future__ import annotations

import threading
import time
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from typing import Any
from urllib.parse import quote

import requests

from config import CONFIG
from growthcrew import store
from growthcrew.agentmail import agentmail_request
from growthcrew.ai import generate_draft, list_gateway_models
from growthcrew.briefing import DEFAULT_BRAND_OFFER, DEFAULT_CTA, DEFAULT_SERVICE_FOCUS
from growthcrew.crypto import decrypt_stored_key, encrypt_string
from growthcrew.errors import GrowthcrewError
from growthcrew.normalize import (
    company_identity_keys,
    field,
    is_valid_email,
    normalize_coreclaw_places,
    normalize_openai_base,
)

RUN_SLUG_OK = __import__("re").compile(r"^[a-zA-Z0-9][a-zA-Z0-9_.~-]*$")


def default_settings() -> dict[str, Any]:
    return {
        "ai": {
            "provider": "gateway",
            "model": CONFIG.LITELLM_MODEL,
            "endpoint": CONFIG.LITELLM_BASE_URL,
            "apiKey": CONFIG.LITELLM_MASTER_KEY,
        },
        "brand": {
            "name": "In2Peta",
            "website": "https://in2peta.io",
            "offer": DEFAULT_BRAND_OFFER,
            "serviceFocus": DEFAULT_SERVICE_FOCUS,
            "cta": DEFAULT_CTA,
        },
        "email": {
            "senderName": "",
            "template": "",
            "centralInbox": CONFIG.CENTRAL_INBOX,
            "physicalAddress": CONFIG.PHYSICAL_ADDRESS,
            "unsubscribeUrl": CONFIG.UNSUBSCRIBE_URL,
        },
        "campaign": {
            "concurrency": CONFIG.CAMPAIGN_CONCURRENCY,
            "maxSendsPerInbox": CONFIG.MAX_SENDS_PER_INBOX,
        },
        "sending": {"mode": "manual"},
    }


def _normalize_provider(value: Any, fallback: str) -> str:
    if value in ("gateway", "gemini", "openai-compatible"):
        return value
    return fallback


def _resolve_ai_key(provider: str, stored_key: str) -> str:
    if stored_key:
        return stored_key
    if provider == "gateway":
        return CONFIG.LITELLM_MASTER_KEY
    if provider == "gemini":
        return CONFIG.GEMINI_API_KEY
    return CONFIG.OPENAI_API_KEY


def _resolve_ai_endpoint(provider: str, stored_endpoint: str) -> str:
    if provider == "gateway":
        return CONFIG.LITELLM_BASE_URL
    if stored_endpoint:
        return stored_endpoint
    return CONFIG.OPENAI_API_BASE or "https://api.openai.com/v1"


def get_settings() -> dict[str, Any]:
    defaults = default_settings()
    row = store.get_settings_row()
    if not row:
        return defaults
    stored_key = decrypt_stored_key(row.get("apiKey") or "")
    provider = _normalize_provider(row.get("aiProvider"), defaults["ai"]["provider"])
    return {
        "ai": {
            "provider": provider,
            "model": row.get("aiModel") or defaults["ai"]["model"],
            "endpoint": _resolve_ai_endpoint(provider, row.get("aiEndpoint") or ""),
            "apiKey": _resolve_ai_key(provider, stored_key),
        },
        "brand": {
            "name": row.get("brandName") or defaults["brand"]["name"],
            "website": row.get("brandWebsite") or defaults["brand"]["website"],
            "offer": row.get("brandOffer") if row.get("brandOffer") is not None else defaults["brand"]["offer"],
            "serviceFocus": row.get("serviceFocus") or defaults["brand"]["serviceFocus"],
            "cta": row.get("cta") or defaults["brand"]["cta"],
        },
        "email": {
            "senderName": row.get("senderName") or "",
            "template": row.get("template") or "",
            "centralInbox": row.get("centralInbox") or defaults["email"]["centralInbox"],
            "physicalAddress": row.get("physicalAddress") or "",
            "unsubscribeUrl": row.get("unsubscribeUrl") or "",
        },
        "campaign": {
            "concurrency": row.get("campaignConcurrency") or defaults["campaign"]["concurrency"],
            "maxSendsPerInbox": row.get("maxSendsPerInbox") or defaults["campaign"]["maxSendsPerInbox"],
        },
        "sending": {"mode": "auto" if row.get("sendMode") == "auto" else "manual"},
    }


def public_settings(settings: dict[str, Any]) -> dict[str, Any]:
    gateway_managed = settings["ai"]["provider"] == "gateway"
    api_key = settings["ai"].get("apiKey") or ""
    return {
        **settings,
        "ai": {
            **settings["ai"],
            "apiKey": "",
            "hasApiKey": gateway_managed or bool(api_key),
            "apiKeyLast4": api_key[-4:] if api_key and not gateway_managed else "",
            "gatewayManaged": gateway_managed,
        },
    }


def save_settings(patch: dict[str, Any]) -> dict[str, Any]:
    current = get_settings()
    ai_patch = patch.get("ai") or {}
    provider = _normalize_provider(ai_patch.get("provider"), current["ai"]["provider"])
    incoming_key = (ai_patch.get("apiKey") or "").strip()
    api_key = CONFIG.LITELLM_MASTER_KEY if provider == "gateway" else (incoming_key or current["ai"]["apiKey"])
    model = (ai_patch.get("model") or "").strip() or current["ai"]["model"] or "gpt-oss-120b"
    endpoint = CONFIG.LITELLM_BASE_URL if provider == "gateway" else ((ai_patch.get("endpoint") or "").strip() or current["ai"]["endpoint"])
    brand = {**current["brand"], **(patch.get("brand") or {})}
    email = {**current["email"], **(patch.get("email") or {})}
    campaign = {**current["campaign"], **(patch.get("campaign") or {})}
    mode = current["sending"]["mode"]
    if (patch.get("sending") or {}).get("mode") in ("auto", "manual"):
        mode = patch["sending"]["mode"]
    concurrency = min(max(int(campaign.get("concurrency") or 10), 1), 50)
    max_sends = min(max(int(campaign.get("maxSendsPerInbox") or 200), 1), 200)
    if provider == "gateway":
        stored_key = ""
    elif incoming_key:
        stored_key = encrypt_string(incoming_key)
    else:
        previous = (store.get_settings_row() or {}).get("apiKey") or ""
        stored_key = previous if previous.startswith("{") else (encrypt_string(previous) if previous else "")
    store.save_settings_row({
        "aiProvider": provider,
        "aiModel": model,
        "aiEndpoint": endpoint,
        "apiKey": "" if provider == "gateway" else stored_key,
        "brandName": brand.get("name") or "",
        "brandWebsite": brand.get("website") or "",
        "brandOffer": brand.get("offer") or "",
        "serviceFocus": brand.get("serviceFocus") or "",
        "cta": brand.get("cta") or "",
        "senderName": email.get("senderName") or "",
        "template": email.get("template") or "",
        "centralInbox": email.get("centralInbox") or "",
        "physicalAddress": email.get("physicalAddress") or "",
        "unsubscribeUrl": email.get("unsubscribeUrl") or "",
        "campaignConcurrency": concurrency,
        "maxSendsPerInbox": max_sends,
        "sendMode": mode,
    })
    return get_settings()


def _lead_row(lead: dict, source: str) -> dict[str, Any]:
    return {
        "email": str(lead.get("email") or "").strip().lower(),
        "name": str(lead.get("name") or ""),
        "company": str(lead.get("company") or ""),
        "title": str(lead.get("title") or ""),
        "phone": str(lead.get("phone") or ""),
        "address": str(lead.get("address") or ""),
        "website": str(lead.get("website") or ""),
        "city": str(lead.get("city") or ""),
        "category": str(lead.get("category") or ""),
        "source": source,
        "raw": lead.get("raw") if isinstance(lead.get("raw"), dict) else {},
    }


def save_leads(leads: list[dict], source: str) -> list[dict]:
    saved = []
    for lead in leads:
        email = str(lead.get("email") or "").strip().lower()
        if not is_valid_email(email):
            continue
        saved.append(store.upsert_lead(email, _lead_row(lead, source)))
    return saved


def list_leads() -> dict[str, Any]:
    leads = store.list_leads()
    unread = sum(1 for lead in leads if lead.get("status") == "REPLIED")
    return {"leads": leads, "unreadReplies": unread}


def delete_lead(lead_id: str) -> dict[str, Any]:
    trimmed = (lead_id or "").strip()
    if not trimmed:
        raise GrowthcrewError("Lead id is required")
    removed = store.delete_lead(trimmed)
    return {"success": True, "alreadyDeleted": not removed} if not removed else {"success": True}


def delete_leads(ids: list[str]) -> dict[str, Any]:
    return {"success": True, "count": store.delete_leads(ids)}


def get_thread(lead_id: str) -> dict[str, Any] | None:
    lead = store.get_lead(lead_id)
    if not lead:
        return None
    return {"lead": lead, "messages": store.list_messages(lead_id)}


def _coreclaw_request(path: str, method: str = "GET", body: dict | None = None) -> dict:
    if not CONFIG.CORECLAW_API_KEY:
        raise GrowthcrewError("Lead search is not configured", 503, "CORECLAW_NOT_CONFIGURED")
    try:
        response = requests.request(
            method,
            f"https://openapi.coreclaw.com/api/v2{path}",
            headers={"Authorization": f"Bearer {CONFIG.CORECLAW_API_KEY}", "Content-Type": "application/json"},
            json=body,
            timeout=20,
        )
    except requests.RequestException as error:
        raise GrowthcrewError("CoreClaw is temporarily unavailable. Please try again shortly.", 502, "CORECLAW_UNAVAILABLE") from error
    if not response.ok:
        raise GrowthcrewError(f"CoreClaw request failed ({response.status_code})", 502, "CORECLAW_REQUEST_FAILED")
    try:
        data = response.json()
    except Exception as error:
        raise GrowthcrewError("Could not read the CoreClaw response. Please try again shortly.", 502, "CORECLAW_INVALID_RESPONSE") from error
    if not isinstance(data, dict):
        raise GrowthcrewError("Could not read the CoreClaw response. Please try again shortly.", 502, "CORECLAW_INVALID_RESPONSE")
    return data


# ---------------------------------------------------------------------------
# Lead search
#
# Searches combine two sources and merge the results:
#   1. The MotherDuck lead database (~10.6M pre-collected USA business leads).
#   2. Live CoreClaw Google Maps search (the original GrowthCrew method).
# ---------------------------------------------------------------------------

_RUNS: dict[str, dict[str, Any]] = {}
_RUNS_ORDER: deque[str] = deque()
_RUNS_LOCK = threading.Lock()
_MAX_TRACKED_RUNS = 100


def _store_run(result: dict[str, Any]) -> None:
    with _RUNS_LOCK:
        _RUNS[result["runSlug"]] = result
        _RUNS_ORDER.append(result["runSlug"])
        while len(_RUNS_ORDER) > _MAX_TRACKED_RUNS:
            _RUNS.pop(_RUNS_ORDER.popleft(), None)


def _coreclaw_configured() -> bool:
    return bool(CONFIG.CORECLAW_API_KEY)


def _database_configured() -> bool:
    try:
        from growthcrew import leadsdb

        return leadsdb.is_configured()
    except Exception:
        return False


def _require_lead_search_configured() -> None:
    if not _coreclaw_configured() and not _database_configured():
        raise GrowthcrewError(
            "Lead search is not configured. Set CORECLAW_API_KEY (live search) and/or "
            "MOTHERDUCK_TOKEN (lead database) in the server environment.",
            503,
            "LEADS_NOT_CONFIGURED",
        )


def _coreclaw_start(query: str, location: str, max_results: int) -> dict[str, str]:
    run = _coreclaw_request(
        "/workers/coreclaw~google-maps-lead-finder/runs",
        "POST",
        {
            "input": {
                "parameters": {
                    "custom": {
                        "search_queries": query,
                        "query": query,
                        "base_location": location,
                        "location": location,
                        "max_results": min(max(max_results, 1), 100),
                        "lead_gen_packs": "lead_enrichment",
                        "email_verification": True,
                        "max_leads_per_place": 1,
                    }
                }
            }
        },
    )
    data = field(run, "data") or {}
    if not isinstance(data, dict):
        data = {}
    run_slug = str(field(data, "run_slug") or field(data, "runSlug") or field(data, "slug") or "")
    if not run_slug:
        raise GrowthcrewError("CoreClaw did not return a run slug", 502, "CORECLAW_INVALID_RESPONSE")
    return {"runSlug": run_slug, "status": "running"}


def _coreclaw_poll(run_slug: str) -> dict[str, Any]:
    run_path = f"/worker-runs/{quote(run_slug, safe='')}"
    poll = _coreclaw_request(run_path)
    info = field(poll, "data") or poll
    if not isinstance(info, dict):
        info = {}
    status = str(field(info, "status") or "").lower()
    if status in ("failed", "error", "cancelled", "canceled"):
        return {"runSlug": run_slug, "status": "failed", "error": f"CoreClaw run {status}. Try another search."}
    if status not in ("succeeded", "success", "completed", "finished", "done"):
        return {"runSlug": run_slug, "status": "running"}
    result = _coreclaw_request(f"{run_path}/result")
    result_data = field(result, "data") or {}
    if not isinstance(result_data, dict):
        result_data = {}
    raw = field(result_data, "list")
    places = raw if isinstance(raw, list) else []
    leads = normalize_coreclaw_places([place for place in places if isinstance(place, dict)])
    return {
        "runSlug": run_slug,
        "status": "completed",
        "leads": leads,
        "totalRawExtracted": len(places),
        "count": len(leads),
        "verifiedEmails": len(leads),
    }


def _coreclaw_search_sync(query: str, location: str, max_results: int) -> dict[str, Any]:
    started = _coreclaw_start(query, location, max_results)
    run_slug = started["runSlug"]
    for _ in range(75):
        time.sleep(4)
        result = _coreclaw_poll(run_slug)
        if result["status"] == "completed":
            return {"leads": result["leads"], "totalRawExtracted": result["totalRawExtracted"], "runSlug": run_slug}
        if result["status"] == "failed":
            raise GrowthcrewError(result["error"], 502, "CORECLAW_RUN_FAILED")
    raise GrowthcrewError(f"CoreClaw run timed out after polling (run {run_slug}). Try a smaller maxResults or retry.", 504, "CORECLAW_RUN_TIMEOUT")


def _database_search(query: str, location: str, max_results: int) -> list[dict]:
    from growthcrew import leadsdb

    if not leadsdb.is_configured():
        return []
    return leadsdb.search_dataset(query, location, max_results)


def _merge_leads(groups: list[list[dict]], max_results: int) -> list[dict]:
    """Round-robin across source groups (database + live), dropping duplicate
    emails and duplicate companies, capped at max_results."""
    wanted = max(int(max_results or 20), 1)
    merged: list[dict] = []
    seen_emails: set[str] = set()
    seen_identity: set[str] = set()
    longest = max((len(group) for group in groups), default=0)
    for depth in range(longest):
        for group in groups:
            if depth >= len(group):
                continue
            lead = group[depth]
            email = str(lead.get("email") or "").strip().lower()
            if not is_valid_email(email) or email in seen_emails:
                continue
            keys = company_identity_keys(str(lead.get("company") or ""), str(lead.get("website") or ""), email)
            if any(key in seen_identity for key in keys):
                continue
            seen_emails.add(email)
            seen_identity.update(keys)
            merged.append(lead)
            if len(merged) >= wanted:
                return merged
    return merged


def _combined_search(query: str, location: str, max_results: int) -> dict[str, Any]:
    warnings: list[str] = []
    groups: list[list[dict]] = []
    database_count = 0
    live_count = 0

    if _database_configured():
        try:
            found = _database_search(query, location, max_results)
            database_count = len(found)
            groups.append(found)
        except Exception as error:
            warnings.append(f"Lead database search failed: {error}")

    if _coreclaw_configured():
        try:
            result = _coreclaw_search_sync(query, location, max_results)
            live = [{**lead, "source": lead.get("source") or "live-search"} for lead in result["leads"]]
            live_count = len(live)
            groups.append(live)
        except GrowthcrewError as error:
            warnings.append(str(error))

    leads = _merge_leads(groups, max_results)
    if not leads and warnings and not groups:
        raise GrowthcrewError(warnings[0], 502, "LEAD_SEARCH_FAILED")
    return {
        "status": "completed",
        "leads": leads,
        "totalRawExtracted": database_count + live_count,
        "count": len(leads),
        "verifiedEmails": len(leads),
        "sources": {"database": database_count, "live": live_count},
        "warnings": warnings,
    }


def _combined_search_worker(run_slug: str, query: str, location: str, max_results: int) -> None:
    try:
        result = _combined_search(query, location, max_results)
        _store_run({**result, "runSlug": run_slug})
    except GrowthcrewError as error:
        _store_run({"runSlug": run_slug, "status": "failed", "error": str(error), "code": error.code})
    except Exception as error:
        _store_run({"runSlug": run_slug, "status": "failed", "error": str(error) or "Lead search failed"})


def start_search(query: str, location: str, max_results: int) -> dict[str, str]:
    """Kick off a combined (database + live) search in the background."""
    _require_lead_search_configured()
    run_slug = f"gc-{int(time.time() * 1000)}"
    _store_run({"runSlug": run_slug, "status": "running"})
    threading.Thread(
        target=_combined_search_worker,
        args=(run_slug, query, location, max_results),
        daemon=True,
    ).start()
    return {"runSlug": run_slug, "status": "running"}


def get_search(run_slug: str) -> dict[str, Any]:
    if not RUN_SLUG_OK.match(run_slug):
        raise GrowthcrewError("Invalid lead search ID")
    with _RUNS_LOCK:
        cached = _RUNS.get(run_slug)
    if cached is not None:
        return cached
    # Older runs (or searches started elsewhere) poll CoreClaw directly.
    if not _coreclaw_configured():
        raise GrowthcrewError("Lead search is not configured", 503, "LEADS_NOT_CONFIGURED")
    return _coreclaw_poll(run_slug)


def search_leads(query: str, location: str, max_results: int) -> dict[str, Any]:
    """Synchronous combined search (database + live)."""
    _require_lead_search_configured()
    result = _combined_search(query, location, max_results)
    return {
        "leads": result["leads"],
        "totalRawExtracted": result["totalRawExtracted"],
        "sources": result["sources"],
        "warnings": result["warnings"],
    }


def lead_database_status() -> dict[str, Any]:
    """Health/summary for the MotherDuck lead database."""
    from growthcrew import leadsdb

    if not leadsdb.is_configured():
        return {"configured": False, "database": CONFIG.MOTHERDUCK_DATABASE, "tables": {}, "totalRows": 0}
    try:
        return leadsdb.dataset_summary()
    except Exception as error:
        return {
            "configured": True,
            "database": CONFIG.MOTHERDUCK_DATABASE,
            "error": str(error),
            "tables": {},
            "totalRows": 0,
        }


def list_inboxes() -> dict:
    return agentmail_request("/inboxes")


def create_inbox(display_name: str | None = None, username: str | None = None) -> dict:
    return agentmail_request(
        "/inboxes",
        "POST",
        {"display_name": display_name, "username": username, "client_id": f"growthcrew-outreach-{int(time.time() * 1000)}"},
    )


def _require_central_inbox(settings: dict) -> str:
    inbox = (settings["email"].get("centralInbox") or "").strip()
    if not inbox:
        raise GrowthcrewError("Central reply inbox is not configured. Set it in GrowthCrew → Settings first.")
    return inbox


def _send_message(inbox_id: str, lead: dict, subject: str, body: str, campaign_id: str, reply_to: str) -> dict:
    email = str(lead.get("email") or "").strip().lower()
    return agentmail_request(
        f"/inboxes/{quote(inbox_id, safe='')}/messages/send",
        "POST",
        {"to": lead.get("email"), "subject": subject, "text": body, "reply_to": reply_to},
        {"Idempotency-Key": f"growthcrew-{campaign_id}-lead-{lead.get('id')}-{email}"},
    )


def _run_indexed(count: int, concurrency: int, worker) -> None:
    workers = min(max(concurrency, 1), max(count, 1))
    with ThreadPoolExecutor(max_workers=workers) as pool:
        list(pool.map(worker, range(count)))


def draft_campaign(leads: list[dict], sender_inbox_ids: list[str], icp: str, product_context: str, sender_name: str | None = None) -> dict:
    settings = get_settings()
    campaign_id = f"gc-{int(time.time() * 1000)}"
    started = time.time()
    save_leads(leads, "growthcrew")
    results: list[dict | None] = [None] * len(leads)

    def worker(index: int) -> None:
        lead = leads[index]
        inbox_id = sender_inbox_ids[index % len(sender_inbox_ids)]
        try:
            draft = generate_draft(settings, lead, icp, product_context or settings["brand"]["offer"], sender_name)
            results[index] = {**lead, "senderInboxId": inbox_id, "status": "draft", "subject": draft["subject"], "body": draft["body"]}
        except Exception as error:
            results[index] = {**lead, "senderInboxId": inbox_id, "status": "failed", "error": str(error) or "Draft failed"}

    _run_indexed(len(leads), int(settings["campaign"]["concurrency"]), worker)
    return {
        "campaignId": campaign_id,
        "drafts": True,
        "sent": 0,
        "failed": sum(1 for result in results if result and result.get("status") == "failed"),
        "results": results,
        "perInboxCount": {inbox_id: 0 for inbox_id in sender_inbox_ids},
        "durationMs": int((time.time() - started) * 1000),
    }


def send_approved(drafts: list[dict], campaign_id: str | None = None) -> dict:
    settings = get_settings()
    reply_to = _require_central_inbox(settings)
    campaign_id = campaign_id or f"gc-{int(time.time() * 1000)}"
    started = time.time()
    results: list[dict | None] = [None] * len(drafts)
    counts: dict[str, int] = {}
    count_lock = threading.Lock()

    def worker(index: int) -> None:
        draft = drafts[index]
        inbox_id = draft["senderInboxId"]
        try:
            with count_lock:
                if counts.get(inbox_id, 0) >= int(settings["campaign"]["maxSendsPerInbox"]):
                    raise RuntimeError(f"Inbox cap reached: {settings['campaign']['maxSendsPerInbox']}")
            _send_message(inbox_id, draft, draft["subject"], draft["body"], campaign_id, reply_to)
            with count_lock:
                counts[inbox_id] = counts.get(inbox_id, 0) + 1
            saved = store.upsert_lead(
                str(draft["email"]).strip().lower(),
                {**_lead_row(draft, "growthcrew"), "lastInboxId": inbox_id, "lastSubject": draft["subject"]},
                status="SENT",
            )
            store.add_message(saved["id"], direction="outbound", subject=draft["subject"], body=draft["body"], inbox_id=inbox_id)
            results[index] = {**draft, "senderInboxId": inbox_id, "status": "sent"}
        except Exception as error:
            store.upsert_lead(str(draft.get("email") or "").strip().lower(), _lead_row(draft, "growthcrew"), status="FAILED")
            results[index] = {**draft, "senderInboxId": inbox_id, "status": "failed", "error": str(error) or "Send failed"}

    _run_indexed(len(drafts), int(settings["campaign"]["concurrency"]), worker)
    return {
        "campaignId": campaign_id,
        "sent": sum(1 for result in results if result and result.get("status") == "sent"),
        "failed": sum(1 for result in results if result and result.get("status") == "failed"),
        "results": results,
        "perInboxCount": counts,
        "durationMs": int((time.time() - started) * 1000),
    }


def send_campaign(leads: list[dict], sender_inbox_ids: list[str], icp: str, product_context: str, sender_name: str | None = None) -> dict:
    settings = get_settings()
    drafted = draft_campaign(leads, sender_inbox_ids, icp, product_context, sender_name)
    if settings["sending"]["mode"] == "manual":
        drafted["results"] = [
            {**result, "status": "sent" if result and result.get("status") == "draft" else "failed"}
            for result in drafted["results"]
        ]
        return drafted
    sendable = [
        result for result in drafted["results"]
        if result and result.get("status") == "draft" and result.get("subject") and result.get("body")
    ]
    return send_approved(sendable, drafted["campaignId"])


def send_draft_message(lead: dict, inbox_id: str, subject: str, body: str) -> dict:
    settings = get_settings()
    reply_to = _require_central_inbox(settings)
    email = str(lead.get("email") or "").strip().lower()
    agentmail_request(
        f"/inboxes/{quote(inbox_id, safe='')}/messages/send",
        "POST",
        {"to": lead.get("email"), "subject": subject, "text": body, "reply_to": reply_to},
        {"Idempotency-Key": f"growthcrew-draft-{int(time.time() * 1000)}-{email}"},
    )
    saved = store.upsert_lead(
        email,
        {**_lead_row(lead, "growthcrew"), "lastInboxId": inbox_id, "lastSubject": subject},
        status="SENT",
    )
    store.add_message(saved["id"], direction="outbound", subject=subject, body=body, inbox_id=inbox_id)
    return {"success": True}


def send_lead_message(lead_id: str, inbox_id: str, subject: str, body: str) -> dict:
    lead = store.get_lead(lead_id)
    if not lead:
        raise GrowthcrewError("Lead not found")
    settings = get_settings()
    reply_to = _require_central_inbox(settings)
    agentmail_request(
        f"/inboxes/{quote(inbox_id, safe='')}/messages/send",
        "POST",
        {"to": lead["email"], "subject": subject, "text": body, "reply_to": reply_to},
        {"Idempotency-Key": f"growthcrew-lead-{lead['id']}-{int(time.time() * 1000)}"},
    )
    store.add_message(lead["id"], direction="outbound", subject=subject, body=body, inbox_id=inbox_id)
    store.upsert_lead(lead["email"], {**_lead_row(lead, lead.get("source") or "growthcrew"), "lastInboxId": inbox_id, "lastSubject": subject}, status="SENT")
    return {"success": True}


def draft_reply(lead_id: str) -> dict[str, str]:
    thread = get_thread(lead_id)
    if not thread:
        raise GrowthcrewError("Lead not found")
    settings = get_settings()
    inbound = [message for message in thread["messages"] if message.get("direction") == "inbound"]
    last = inbound[-1] if inbound else None
    lead = thread["lead"]
    context = (
        f"The prospect just replied:\nSubject: {last.get('subject')}\n{last.get('body')}\n\nWrite a helpful reply continuing this thread."
        if last else "Write a short follow-up email."
    )
    return generate_draft(settings, lead, "Replying to an interested prospect", f"{settings['brand']['offer']}\n\n{context}", settings["email"].get("senderName"))


def record_inbound(inbox_id: str, message_id: str, sender: str, subject: str, body: str) -> dict | None:
    match = __import__("re").search(r"<([^>]+)>", sender)
    email = (match.group(1) if match else sender).strip().lower()
    if not email:
        return None
    existing = store.find_message_by_provider(message_id)
    if existing:
        return store.get_lead(existing["leadId"])
    lead = store.get_lead_by_email(email)
    if not lead:
        return None
    store.add_message(lead["id"], direction="inbound", subject=subject, body=body, inbox_id=inbox_id, provider_message_id=message_id)
    return store.mark_replied(lead["id"])


OUTBOUND_STATES = {"outbound", "sent", "outgoing", "send", "delivered"}


def _is_outbound_message(message: dict) -> bool:
    raw = str(field(message, "direction") or field(message, "folder") or field(message, "status") or "").strip().lower()
    return raw in OUTBOUND_STATES


def _extract_sender_email(from_raw: Any) -> str:
    if isinstance(from_raw, str):
        match = __import__("re").search(r"<([^>]+)>", from_raw)
        return (match.group(1) if match else from_raw).strip().lower()
    if isinstance(from_raw, dict):
        candidate = from_raw.get("email") or from_raw.get("address") or from_raw.get("from") or ""
        if isinstance(candidate, str):
            match = __import__("re").search(r"<([^>]+)>", candidate)
            return (match.group(1) if match else candidate).strip().lower()
    return ""


def relay_replies(inbox_ids: list[str], destination: str) -> list[dict]:
    if not (destination or "").strip():
        raise GrowthcrewError("Reply destination inbox is not configured.")
    destination_email = destination.strip().lower()
    forwarded = []
    for inbox_id in inbox_ids:
        listing = agentmail_request(f"/inboxes/{quote(inbox_id, safe='')}/messages?limit=25")
        messages = field(listing, "messages") or field(listing, "data") or []
        if not isinstance(messages, list):
            continue
        for message in messages:
            if not isinstance(message, dict) or _is_outbound_message(message):
                continue
            message_id = str(field(message, "message_id") or field(message, "messageId") or field(message, "id") or "")
            if not message_id or store.find_message_by_provider(message_id):
                continue
            # Only true inbound replies from known leads are forwarded.
            # Outbound sends go only to the lead (Reply-To is header-only).
            sender = _extract_sender_email(field(message, "from"))
            if not sender or not is_valid_email(sender):
                continue
            if sender == destination_email:
                continue
            if not store.get_lead_by_email(sender):
                continue
            agentmail_request(
                f"/inboxes/{quote(inbox_id, safe='')}/messages/{quote(message_id, safe='')}/forward",
                "POST",
                {"to": destination},
            )
            if sender:
                try:
                    record_inbound(inbox_id, message_id, sender, str(field(message, "subject") or ""), str(field(message, "body_text") or field(message, "body") or ""))
                except Exception:
                    pass
            forwarded.append({"inboxId": inbox_id, "messageId": message_id, "subject": field(message, "subject"), "from": field(message, "from")})
    return forwarded


def forward_reply(inbox_id: str, message_id: str, destination: str) -> dict:
    return agentmail_request(
        f"/inboxes/{quote(inbox_id, safe='')}/messages/{quote(message_id, safe='')}/forward",
        "POST",
        {"to": destination},
    )


def fetch_message(inbox_id: str, message_id: str) -> dict[str, str]:
    data = agentmail_request(f"/inboxes/{quote(inbox_id, safe='')}/messages/{quote(message_id, safe='')}")
    message = field(data, "message") or data
    if not isinstance(message, dict):
        message = {}
    sender = _extract_sender_email(field(message, "from"))
    body = str(field(message, "body_text") or field(message, "text") or field(message, "body") or "")
    direction = str(field(message, "direction") or field(message, "folder") or field(message, "status") or "")
    return {"from": sender, "subject": str(field(message, "subject") or ""), "body": body, "direction": direction}


def handle_inbound_webhook(inbox_id: str, message_id: str, destination: str) -> dict | None:
    """Fetch first, forward only for true inbound replies from known leads."""
    full = fetch_message(inbox_id, message_id)
    if (full.get("direction") or "").strip().lower() in OUTBOUND_STATES:
        return None
    sender = (full.get("from") or "").strip().lower()
    if not sender or not is_valid_email(sender):
        return None
    if sender == (destination or "").strip().lower():
        return None
    if not store.get_lead_by_email(sender):
        return None
    if store.find_message_by_provider(message_id):
        return None
    forward_reply(inbox_id, message_id, destination)
    try:
        record_inbound(inbox_id, message_id, sender, full.get("subject") or "", full.get("body") or "")
    except Exception:
        pass
    return {"from": sender, "subject": full.get("subject") or ""}


def register_webhook(url: str, inbox_ids: list[str]) -> dict:
    return agentmail_request("/webhooks", "POST", {"url": url, "event_types": ["message.received"], "inbox_ids": inbox_ids})


def test_provider() -> dict[str, str]:
    settings = get_settings()
    return generate_draft(
        settings,
        {
            "id": "test",
            "name": "Test Contact",
            "email": "test@example.com",
            "company": "Example AI",
            "title": "Head of Engineering",
            "city": "San Francisco",
            "category": "AI software company",
            "raw": {"description": "Test data only"},
        },
        "AI product teams",
        settings["brand"]["offer"],
        settings["email"].get("senderName"),
    )


def valid_run_slug(run_slug: str) -> bool:
    return bool(RUN_SLUG_OK.match(run_slug))
