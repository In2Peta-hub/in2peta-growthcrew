"""Outreach draft generation. Gateway-first, with Gemini and OpenAI-compatible fallbacks."""

from __future__ import annotations

import json
import time
from typing import Any

import requests

from config import CONFIG
from growthcrew.briefing import (
    DEFAULT_ICP,
    GATEWAY_FALLBACK_MODELS,
    IN2PETA_MASTER_OUTREACH_BRIEFING,
)
from growthcrew.normalize import city_from_lead, field, first_name, normalize_openai_base, render_template

_MODEL_CACHE: dict[str, tuple[list[str], float]] = {}
_CACHE_TTL = 5 * 60


def list_gateway_models(base: str, key: str) -> list[str]:
    normalized = normalize_openai_base(base)
    now = time.time()
    cached = _MODEL_CACHE.get(normalized)
    if cached and now - cached[1] < _CACHE_TTL:
        return cached[0]
    if not key:
        return cached[0] if cached else []
    try:
        response = requests.get(f"{normalized}/models", headers={"Authorization": f"Bearer {key}"}, timeout=8)
        if not response.ok:
            return cached[0] if cached else []
        data = response.json() if response.content else {}
        models = [entry.get("id") for entry in (data.get("data") or []) if isinstance(entry, dict) and isinstance(entry.get("id"), str) and entry.get("id")]
        if models:
            _MODEL_CACHE[normalized] = (models, now)
            return models
        return cached[0] if cached else []
    except Exception:
        return cached[0] if cached else []


def parse_draft(text: str) -> dict[str, str]:
    cleaned = text.replace("```json", "").replace("```", "").strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    candidate = cleaned[start : end + 1] if start >= 0 and end > start else cleaned
    parsed = json.loads(candidate)
    subject = parsed.get("subject")
    body = parsed.get("body")
    if not isinstance(subject, str) or not isinstance(body, str) or not subject or not body:
        raise RuntimeError("AI returned an invalid email draft")
    return {"subject": subject.strip(), "body": body.strip()}


def build_prompt(settings: dict, lead: dict, icp: str, product_context: str, sender_name: str | None = None) -> str:
    email = settings["email"]
    brand = settings["brand"]
    has_template = bool((email.get("template") or "").strip())
    sender = sender_name or email.get("senderName") or "The In2Peta team"
    if has_template:
        rendered = render_template(email["template"], lead, settings, sender_name)
        template_section = (
            "Custom template — follow it exactly: keep its blocks, order, line breaks, greeting, and sign-off. "
            "Replace placeholder content with facts about this lead, and resolve any leftover {{placeholders}} "
            "(e.g. {{personalization_hook}}) with real sentences. Do not compress it into one paragraph.\n"
            f"---\n{rendered}\n---"
        )
    else:
        template_section = (
            "Default structure — use exactly these blocks, each separated by one blank line:\n"
            f"Hi {first_name(lead.get('name') or 'there')},\n\n"
            "<1-2 sentence hook from this lead's facts>\n\n"
            "<2-3 sentence value paragraph: most relevant catalog slice + 70-90% cost contrast>\n\n"
            "<one CTA question>\n\n"
            f"Best,\n{sender}\n{brand['name']}"
        )
    raw = lead.get("raw") if isinstance(lead.get("raw"), dict) else {}
    public_detail = field(raw, "topReviewSnippet") or field(raw, "description") or field(raw, "website_description") or ""
    facts = {
        "name": lead.get("name"),
        "company": lead.get("company"),
        "title": lead.get("title"),
        "city": city_from_lead(lead),
        "address": lead.get("address"),
        "website": lead.get("website"),
        "category": lead.get("category"),
        "rating": lead.get("rating"),
        "reviewCount": lead.get("reviewCount"),
        "publicDetail": public_detail,
    }
    return f"""{IN2PETA_MASTER_OUTREACH_BRIEFING}

You write one truthful, concise B2B email for {brand['name']}. Use the Master Briefing above as the knowledge base and email blueprint.

Rules:
- Structure is mandatory: greeting line, blank line, short paragraphs (one idea each, separated by blank lines), CTA question, blank line, sign-off. Never return the body as a single wall of text.
- Follow the custom template when provided (it wins over the default structure); otherwise use the default structure above.
- Personalize only from supplied lead facts. Never invent a relationship, customer, funding, product, employee, or achievement.
- Keep the body between 80 and 140 words.
- Plain text only; one clear CTA (free credits / 15-min demo / pilot on sample assets); no markdown, emojis, hype, or fake familiarity.
- Do not append any unsubscribe text, opt-out line, or footer. The sign-off is just name + brand.
- Select the 1–2 most relevant catalog slices for each prospect — image/video for creators & e-com (FLUX/Qwen, LTX, Z-Image), LLM/Smart Router & ADE for developers, TTS/ASR for localization, annotation pilots for data teams — and anchor 70%–90% cost contrast. The apparel example in the briefing is just one illustration.
- Return only JSON: {{"subject":"...","body":"..."}}.

ICP: {icp or DEFAULT_ICP}
Offer context: {product_context or brand.get('offer') or ''}
Lead facts: {json.dumps(facts)}

{template_section}"""


def _message_text(content: Any) -> str:
    if isinstance(content, list):
        return "".join(part.get("text") or "" for part in content if isinstance(part, dict))
    return content or ""


def chat_via_openai(endpoint: str, api_key: str, model: str, prompt: str, system: str = "Return only valid JSON with subject and body fields.") -> str:
    response = requests.post(
        f"{normalize_openai_base(endpoint)}/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.6,
            "response_format": {"type": "json_object"},
        },
        timeout=60,
    )
    data = response.json() if response.content else {}
    if not response.ok:
        message = (data.get("error") or {}).get("message") if isinstance(data.get("error"), dict) else None
        raise RuntimeError(f"AI provider error ({response.status_code}) on model {model}: {message or 'request failed'}")
    return _message_text(((data.get("choices") or [{}])[0].get("message") or {}).get("content"))


def chat_via_gemini(api_key: str, model: str, prompt: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{requests.utils.quote(model, safe='')}:generateContent"
    response = requests.post(
        url,
        params={"key": api_key},
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0.6},
        },
        timeout=60,
    )
    data = response.json() if response.content else {}
    if not response.ok:
        message = (data.get("error") or {}).get("message") if isinstance(data.get("error"), dict) else None
        raise RuntimeError(message or f"Gemini request failed ({response.status_code})")
    parts = (((data.get("candidates") or [{}])[0].get("content") or {}).get("parts") or [])
    return "".join(part.get("text") or "" for part in parts if isinstance(part, dict))


def generate_draft(settings: dict, lead: dict, icp: str, product_context: str, sender_name: str | None = None) -> dict[str, str]:
    prompt = build_prompt(settings, lead, icp, product_context, sender_name)
    provider = settings["ai"]["provider"]
    if provider == "gateway":
        key = CONFIG.LITELLM_MASTER_KEY
        base = CONFIG.LITELLM_BASE_URL
        if not key:
            raise RuntimeError("AI gateway is not configured (LITELLM_MASTER_KEY is missing).")
        discovered = list_gateway_models(base, key)
        candidates = list(dict.fromkeys([CONFIG.LITELLM_MODEL, settings["ai"].get("model"), *discovered, *GATEWAY_FALLBACK_MODELS]))
        last_error: Exception = RuntimeError("AI gateway is not configured.")
        for model in candidates:
            if not model:
                continue
            try:
                return parse_draft(chat_via_openai(base, key, model, prompt))
            except Exception as error:
                last_error = error
        raise last_error

    if provider == "openai-compatible":
        if not settings["ai"].get("apiKey"):
            raise RuntimeError("No AI provider key configured in GrowthCrew settings or environment.")
        discovered = list_gateway_models(settings["ai"]["endpoint"], settings["ai"]["apiKey"])
        candidates = list(dict.fromkeys([settings["ai"].get("model") or "gpt-oss-120b", *discovered, *GATEWAY_FALLBACK_MODELS]))
        last_error = RuntimeError("AI provider failed for all fallback models.")
        for model in candidates:
            try:
                return parse_draft(chat_via_openai(settings["ai"]["endpoint"], settings["ai"]["apiKey"], model, prompt))
            except Exception as error:
                last_error = error
        raise last_error

    if not settings["ai"].get("apiKey"):
        raise RuntimeError("No AI provider key configured in GrowthCrew settings or environment.")
    models = list(dict.fromkeys([settings["ai"].get("model"), "gemini-2.5-flash", "gemini-flash-latest"]))
    last_error = RuntimeError("Gemini provider failed")
    for model in models:
        if not model:
            continue
        try:
            return parse_draft(chat_via_gemini(settings["ai"]["apiKey"], model, prompt))
        except Exception as error:
            last_error = error
    raise last_error
