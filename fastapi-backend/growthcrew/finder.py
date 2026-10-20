"""GrowthCrew lead finder: ranking, previews, accounts, batches and autopilot.

Implements docs/lead-finder-spec.md §1-§5 and §7. The pure functions at the top
(the names and signatures in §4) are unit-tested in tests/test_finder.py; the
rest wires them to the lead database, live search, AI and AgentMail.

Honesty rules that shape every string we produce:

- A "why" line only says what the record says: role, company, city, category,
  website, rating. No funding, hiring, growth, awards or intent.
- Normalizer defaults ("Owner / Representative", "Team at X", "X Owner",
  "Local Business", "Business") mean *unknown*, so they become ``None``.
- AI output is validated; anything out of range, too long, or naming someone
  the record does not name is replaced by the deterministic fallback.
"""

from __future__ import annotations

import csv
import hashlib
import hmac
import io
import json
import logging
import re
import secrets
import threading
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Callable
from urllib.parse import quote

from config import CONFIG
from growthcrew import finder_store, leadsdb, service, webpage
from growthcrew.agentmail import agentmail_request
from growthcrew.ai import chat_via_gemini, chat_via_openai, list_gateway_models
from growthcrew.briefing import GATEWAY_FALLBACK_MODELS
from growthcrew.digest_email import render_digest
from growthcrew.errors import GrowthcrewError
from growthcrew.normalize import (
    clean_phone,
    company_identity_keys,
    first_name,
    is_valid_email,
    normalize_company_name,
)

logger = logging.getLogger("growthcrew.finder")

PREVIEW_LEAD_COUNT = 5
PREVIEW_CANDIDATE_FACTOR = 6
PREVIEW_MAX_SECONDS = 50.0
PREVIEW_TTL_SECONDS = 24 * 60 * 60
AI_SHORTLIST = 12
BATCH_DAILY_LIMIT = 20
RATE_WINDOW_SECONDS = 60 * 60

DEFAULT_COMPANIES = {"local business", "local businesses", "business", "n/a", "none", "unknown", "-"}
IGNORED_CATEGORIES = {"business", "ai and technology", "local business"}
FORBIDDEN_CLAIMS = (
    "funding",
    "funded",
    "raised",
    "hiring",
    "growing",
    "growth",
    "investment",
    "investor",
    "valuation",
    "award",
    "awarded",
    "expanding",
    "expansion",
    "customers",
    "revenue",
    "recently announced",
    "just launched",
)
HYPE_WORDS = (
    "unlock",
    "supercharge",
    "revolution",
    "game-changing",
    "game changing",
    "leverage",
    "synergy",
    "guarantee",
    "10x",
    "skyrocket",
    "transform",
    "disrupt",
    "crush",
    "conversion-focused",
    "conversion focused",
    "cutting-edge",
    "world-class",
    "seamless",
    "elevate",
    "boost your",
)

# A first message may not describe or judge anything we have not seen.
UNSEEN_CLAIMS = (
    "your site", "your website", "your current site", "your reviews", "your work",
    "your services", "your team", "your growth", "your patients love",
    "impressed", "love what you", "solo founder",
    # Nothing tells us the sender has past clients or results to point to.
    "we have helped", "we've helped", "we helped", "our clients", "our customers",
    "case stud", "examples of", "similar clinics", "similar businesses", "track record",
)

STOPWORDS = {
    "a", "an", "and", "the", "in", "of", "at", "on", "for", "with", "near",
    "nearby", "around", "me", "my", "to", "who", "that", "people", "someone",
}

# Query words and the words a record is likely to use instead. Only used to
# decide relevance, never shown to a user.
TRADE_ALIASES: dict[str, tuple[str, ...]] = {
    "dentist": ("dental",),
    "orthodontist": ("dental", "orthodontic"),
    "doctor": ("medical", "clinic", "physician"),
    "physician": ("medical", "clinic"),
    "lawyer": ("law", "legal", "attorney"),
    "attorney": ("law", "legal"),
    "accountant": ("accounting", "bookkeeping", "tax"),
    "plumber": ("plumbing",),
    "roofer": ("roofing",),
    "electrician": ("electrical",),
    "realtor": ("real estate", "property"),
    "saas": ("software", "technology"),
    "startup": ("software", "technology"),
    "founder": ("owner", "ceo", "founder"),
    "salon": ("beauty", "hair"),
    "restaurant": ("food", "cafe", "restaurant"),
    "gym": ("fitness", "gym"),
    "photographer": ("photography",),
    "marketer": ("marketing",),
    "consultant": ("consulting",),
}

# Plainer, noun-shaped phrasings used only in "try this instead" suggestions.
TRADE_DISPLAY: dict[str, str] = {
    "dentist": "dental practices",
    "orthodontist": "orthodontic practices",
    "doctor": "medical practices",
    "physician": "medical practices",
    "lawyer": "law firms",
    "attorney": "law firms",
    "accountant": "accounting firms",
    "plumber": "plumbing companies",
    "roofer": "roofing companies",
    "electrician": "electrical companies",
    "realtor": "real estate agencies",
    "saas": "software companies",
    "startup": "software companies",
    "salon": "beauty salons",
    "restaurant": "restaurants",
    "gym": "gyms",
    "photographer": "photography studios",
    "marketer": "marketing agencies",
    "consultant": "consulting firms",
}

US_HINTS = {
    "usa", "us", "u.s.", "u.s.a.", "united states", "united states of america",
    "america", "states",
}
US_STATES = {
    "alabama", "alaska", "arizona", "arkansas", "california", "colorado",
    "connecticut", "delaware", "florida", "georgia", "hawaii", "idaho",
    "illinois", "indiana", "iowa", "kansas", "kentucky", "louisiana", "maine",
    "maryland", "massachusetts", "michigan", "minnesota", "mississippi",
    "missouri", "montana", "nebraska", "nevada", "new hampshire", "new jersey",
    "new mexico", "new york", "north carolina", "north dakota", "ohio",
    "oklahoma", "oregon", "pennsylvania", "rhode island", "south carolina",
    "south dakota", "tennessee", "texas", "utah", "vermont", "virginia",
    "washington", "west virginia", "wisconsin", "wyoming", "district of columbia",
}
NON_US_HINTS = {
    "india", "pune", "mumbai", "delhi", "new delhi", "bangalore", "bengaluru",
    "hyderabad", "chennai", "kolkata", "ahmedabad", "jaipur", "surat", "goa",
    "united kingdom", "uk", "england", "scotland", "wales", "london",
    "manchester", "birmingham", "edinburgh", "ireland", "dublin", "canada",
    "toronto", "vancouver", "montreal", "ottawa", "australia", "sydney",
    "melbourne", "brisbane", "perth", "new zealand", "auckland", "germany",
    "berlin", "munich", "hamburg", "france", "paris", "lyon", "spain",
    "madrid", "barcelona", "italy", "rome", "milan", "netherlands", "amsterdam",
    "belgium", "brussels", "portugal", "lisbon", "sweden", "stockholm", "norway",
    "oslo", "denmark", "copenhagen", "finland", "helsinki", "poland", "warsaw",
    "switzerland", "zurich", "austria", "vienna", "singapore", "malaysia",
    "kuala lumpur", "indonesia", "jakarta", "philippines", "manila", "thailand",
    "bangkok", "vietnam", "hanoi", "japan", "tokyo", "osaka", "china",
    "shanghai", "beijing", "shenzhen", "hong kong", "taiwan", "taipei", "korea",
    "seoul", "uae", "dubai", "abu dhabi", "saudi arabia", "riyadh", "qatar",
    "doha", "israel", "tel aviv", "turkey", "istanbul", "egypt", "cairo",
    "south africa", "johannesburg", "cape town", "kenya", "nairobi", "nigeria",
    "lagos", "ghana", "accra", "brazil", "sao paulo", "rio de janeiro", "mexico",
    "mexico city", "argentina", "buenos aires", "chile", "santiago", "colombia",
    "bogota", "pakistan", "karachi", "lahore", "bangladesh", "dhaka",
    "sri lanka", "colombo", "nepal", "kathmandu", "russia", "moscow",
}

_AI_TIMEOUTS = {"understand": 10.0, "site": 10.0, "pick": 20.0, "message": 25.0}


# ---------------------------------------------------------------------------
# Small text helpers
# ---------------------------------------------------------------------------


def _text(value: Any) -> str:
    if value is None:
        return ""
    return " ".join(str(value).split()).strip()


def _clip(value: str, limit: int) -> str:
    """Collapse whitespace and cut at a word boundary so len <= limit."""
    text = _text(value)
    if len(text) <= limit:
        return text
    cut = text[: max(limit - 1, 1)].rsplit(" ", 1)[0].rstrip(" ,.;:-")
    if not cut:
        cut = text[: max(limit - 1, 1)]
    return f"{cut}…"[:limit]


def _clean_company(value: Any) -> str:
    company = _text(value)
    if company.lower() in DEFAULT_COMPANIES:
        return ""
    moved = re.fullmatch(r"(.+?),?\s+(the)", company, re.I)
    if moved:
        company = f"The {moved.group(1)}"
    return company


def _clean_website(value: Any) -> str:
    website = _text(value)
    if not website:
        return ""
    if website.lower().startswith(("http://", "https://")):
        return website
    if re.match(r"^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(/\S*)?$", website, re.I):
        return f"https://{website}"
    return ""


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_iso(value: Any) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _sha256_hex(value: str) -> str:
    return hashlib.sha256(str(value).encode("utf-8")).hexdigest()


def _json_object(raw: Any) -> dict:
    if not isinstance(raw, str):
        raise ValueError("AI response was not text")
    cleaned = raw.replace("```json", "").replace("```", "").strip()
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start < 0 or end <= start:
        raise ValueError("AI response did not contain a JSON object")
    parsed = json.loads(cleaned[start : end + 1])
    if not isinstance(parsed, dict):
        raise ValueError("AI response was not a JSON object")
    return parsed


# ---------------------------------------------------------------------------
# §4 pure functions
# ---------------------------------------------------------------------------


def parse_describe_fallback(describe: str) -> dict:
    """Split a one-line description without AI.

    The last " in " / " near " / " around " is the place, so "people in tech in
    Austin" keeps "people in tech" as the who and "Austin" as the where.
    """
    text = _text(describe).strip(" .?!,")
    if not text:
        return {"who": "", "where": None, "offer": None}

    matches = list(re.finditer(r"\s+(?:in|near|around)\s+", text, re.I))
    if not matches:
        return {"who": text, "where": None, "offer": None}

    last = matches[-1]
    who = text[: last.start()].strip(" ,.;:-")
    where = text[last.end() :].strip(" ,.;:-")
    if not who:
        return {"who": text, "where": None, "offer": None}
    return {"who": who, "where": where or None, "offer": None}


def lead_key(email: str) -> str:
    """Stable per-email key: sha1(lowercased, trimmed email)[:16]."""
    return hashlib.sha1(str(email or "").lower().strip().encode("utf-8")).hexdigest()[:16]


def clean_person_name(name: str | None) -> str | None:
    """A real person name, or None when the record only has a normalizer default."""
    text = _text(name).strip(" ,.;:-'\"")
    if not text:
        return None
    lowered = text.lower()
    if lowered in {
        "local business", "business", "team", "the team", "owner", "representative",
        "contact", "admin", "manager", "unknown", "n/a", "none", "-",
    }:
        return None
    if re.fullmatch(r"team\s+at\s+.+", lowered):
        return None
    if re.fullmatch(r".+\s+owner", lowered):
        return None
    if re.fullmatch(r".+\s+representative", lowered):
        return None
    if "@" in text or "www." in lowered or lowered.startswith("http"):
        return None
    if not re.search(r"[a-z]", lowered):
        return None
    # The source sometimes joins two people into one field ("John Smith Kevin
    # Murray"). Four or more full words with no initial is almost always that;
    # showing the company is better than showing a wrong name.
    words = text.split()
    if len(words) >= 4 and not any(re.fullmatch(r"[A-Za-z]\.?", word) for word in words):
        return None
    if len(words) >= 5 or any(re.fullmatch(r"(dr|mr|mrs|ms|prof)\.?", word, re.I) for word in words[1:]):
        return None
    return text


def clean_role(title: str | None) -> str | None:
    """A real job title, or None when it is a normalizer default or empty."""
    text = _text(title).strip(" ,.;:-")
    if not text:
        return None
    lowered = re.sub(r"\s*/\s*", " / ", text.lower())
    if lowered in {
        "owner / representative", "representative", "contact", "team", "n/a",
        "none", "unknown", "-", "employee",
    }:
        return None
    # Source titles are often "CEO - marketing, sales, and more". Keep the
    # part that names the role; the rest is noise in a card or a message.
    for separator in (" - ", " – ", " | ", ", "):
        if separator in text:
            head = text.split(separator, 1)[0].strip(" ,.;:-")
            if len(head) >= 4:
                text = head
                break
    return text


_RUNS_THE_COMPANY = (
    "owner",
    "founder",
    "ceo",
    "chief executive",
    "president",
    "principal",
    "managing director",
    "managing member",
    "managing partner",
    "partner",
    "proprietor",
    "practice owner",
    "chairman",
    "dentist",
    "doctor",
    "physician",
)


def runs_the_company(role: str | None) -> bool:
    """True when this title usually means the person decides for the business."""
    if clean_role(role) is None:
        return False
    # Check the whole source title, not the trimmed display version, so
    # "Associate, Owner" still counts as running the company.
    lowered = _text(role).lower()
    for segment in re.split(r"\s*(?:,|/|\||\s-\s|\s–\s|&|\band\b)\s*", lowered):
        if re.search(r"\b(vice|vp|svp|evp|assistant|asst|deputy|former|retired|to the)\b", segment):
            continue
        if any(re.search(rf"\b{re.escape(keyword)}s?\b", segment) for keyword in _RUNS_THE_COMPANY):
            return True
    return False


def _who_tokens(who: str) -> set[str]:
    tokens: set[str] = set()
    for raw in re.findall(r"[a-z0-9]+", _text(who).lower()):
        if len(raw) < 2 or raw in STOPWORDS:
            continue
        tokens.add(raw)
        if raw.endswith("es") and len(raw) > 4:
            tokens.add(raw[:-2])
        if raw.endswith("s") and len(raw) > 3:
            tokens.add(raw[:-1])
        for variant in (raw, raw[:-1] if raw.endswith("s") else raw):
            for alias in TRADE_ALIASES.get(variant, ()):
                tokens.update(part for part in alias.split() if part)
    return tokens


# Words the database query may also search for, so "dentists" finds records
# stored as "dental". Keep expansions specific to the requested trade or role;
# generic words such as "business" would match almost every row.
DB_BROADEN: dict[str, str] = {
    "saas": "software",
    "founder": "founder",
    "dentist": "dental",
    "orthodontist": "orthodontic",
    "doctor": "medical",
    "physician": "medical",
    "lawyer": "law",
    "attorney": "law",
    "accountant": "accounting",
    "plumber": "plumbing",
    "roofer": "roofing",
    "electrician": "electrical",
    "realtor": "real estate",
    "salon": "beauty",
    "gym": "fitness",
    "photographer": "photography",
    "marketer": "marketing",
    "consultant": "consulting",
}


def _database_query(who: str) -> str:
    """The user's words plus at most two trade or role terms for SQL search.

    leadsdb matches ANY token, so adding "dental" to "dentists" turns two
    matches into a usable pool without changing the meaning of the search.
    """
    extras: list[str] = []
    words = set(re.findall(r"[a-z0-9]+", _text(who).lower()))
    for raw in re.findall(r"[a-z0-9]+", _text(who).lower()):
        for variant in (raw, raw[:-1] if raw.endswith("s") else raw):
            extra = DB_BROADEN.get(variant)
            if extra and extra not in extras and extra not in words:
                extras.append(extra)
    return " ".join([_text(who), *extras[:2]]).strip()


def _short_place(value: Any) -> str:
    place = _text(value)
    if "," in place:
        head = place.split(",", 1)[0].strip()
        if len(head) >= 2:
            return head
    return place


def _candidate_relevance(candidate: dict, tokens: set[str]) -> int:
    if not tokens:
        return 0
    haystack = " ".join(
        _text(candidate.get(key)) for key in ("title", "role", "company", "category")
    ).lower()
    if not haystack:
        return 0
    # Whole words (with plural/suffix room at the end), so "dent" in
    # "Occidentalbeads" doesn't count as a dentist.
    return sum(1 for token in tokens if re.search(rf"\b{re.escape(token)}", haystack))


def rank_candidates(candidates: list[dict], who: str, limit: int) -> list[dict]:
    """Relevance + seniority, one person per company, best first.

    A candidate with no query word anywhere in their title, company, category
    or website is dropped unless they run the company (an owner of a
    differently-labelled business is still worth showing).
    """
    if not candidates or limit <= 0:
        return []
    tokens = _who_tokens(who)
    wants_founder = bool(re.search(r"\bfounders?\b", who, re.I))
    scored: list[tuple[float, int, dict]] = []
    for index, candidate in enumerate(candidates):
        if not isinstance(candidate, dict):
            continue
        role = clean_role(candidate.get("role") or candidate.get("title"))
        if wants_founder and not re.search(r"\b(?:co[ -]?)?founder\b", role or "", re.I):
            continue
        company = _clean_company(candidate.get("company"))
        if not company:
            continue
        relevance = _candidate_relevance(candidate, tokens)
        seniority = 1 if runs_the_company(role) else 0
        if relevance == 0 and not seniority:
            continue
        score = (2.0 * relevance) + (1.5 * seniority)
        scored.append((score, index, candidate))

    scored.sort(key=lambda item: (-item[0], item[1]))

    seen_identities: set[str] = set()
    ranked: list[dict] = []
    for _score, _index, candidate in scored:
        identities = company_identity_keys(
            _clean_company(candidate.get("company")),
            _text(candidate.get("website")),
            _text(candidate.get("email")),
        )
        if any(identity in seen_identities for identity in identities):
            continue
        seen_identities.update(identities)
        ranked.append(candidate)
        if len(ranked) >= limit:
            break
    return ranked


def fallback_why(lead: dict) -> str:
    """One honest line built only from the record's own parts."""
    role = clean_role(lead.get("role") or lead.get("title"))
    company = _clean_company(lead.get("company"))
    city = _text(lead.get("city"))
    category = _text(lead.get("category"))
    if category.lower() in IGNORED_CATEGORIES:
        category = ""

    if role and company:
        text = f"{role} at {company}"
    elif company:
        text = company
    elif role:
        text = role
    elif category:
        text = category
    else:
        text = "A business with an email address"

    if city and city.lower() not in text.lower():
        text = f"{text}, {city}"
    return _clip(text, 110)


def _fact_tokens(entry: dict) -> set[str]:
    blob = " ".join(
        _text(entry.get(key))
        for key in ("title", "role", "category", "company", "city")
    )
    tokens = {
        token
        for token in re.findall(r"[a-z0-9]+", blob.lower())
        if len(token) >= 3 and token not in STOPWORDS
    }
    return tokens


def score_candidate(candidate: dict, kept: list[dict], skipped: list[dict]) -> float:
    """Similarity to kept leads minus similarity to skipped leads, plus seniority.

    Deterministic and cheap: shared title/category/city/company words. A person
    who runs the company gets a small constant bonus so they win ties.
    """
    candidate_tokens = _fact_tokens(candidate)
    if not candidate_tokens:
        return 0.0

    def similarity(group: list[dict]) -> float:
        if not group:
            return 0.0
        total = 0.0
        for entry in group:
            if not isinstance(entry, dict):
                continue
            shared = candidate_tokens & _fact_tokens(entry)
            total += len(shared) / len(candidate_tokens)
        return total / len(group)

    role = clean_role(candidate.get("role") or candidate.get("title"))
    bonus = 0.5 if runs_the_company(role) else 0.0
    return round(similarity(kept) - similarity(skipped) + bonus, 6)


def _trade_variant(who: str) -> str:
    words = who.split()
    if not words:
        return who
    last = re.sub(r"[^a-z]", "", words[-1].lower())
    display = TRADE_DISPLAY.get(last) or TRADE_DISPLAY.get(last.rstrip("s"))
    if display:
        return " ".join([*words[:-1], display]).strip()
    if last.endswith("s") and len(last) > 3:
        return " ".join([*words[:-1], last[:-1]]).strip()
    return f"{who} businesses"


def broader_suggestions(understood: dict) -> list[str]:
    """Exactly three other sentences to try, all different from the input."""
    who = _text((understood or {}).get("who")) or "local businesses"
    where = _text((understood or {}).get("where"))
    original = f"{who} in {where}" if where else who

    pool: list[str] = []
    if where:
        pool.append(who)  # drop the place
        pool.append(f"{_trade_variant(who)} in {where}")  # plainer trade word
        pool.append(f"{who} nearby")  # widen the place
        pool.append(f"{who} in a bigger city")
        pool.append(f"{_trade_variant(who)} nearby")
    else:
        words = who.split()
        if len(words) > 1:
            pool.append(" ".join(words[1:]))  # drop the qualifier
        pool.append(_trade_variant(who))
        pool.append(f"{who} companies")
        pool.append(f"{who} in a bigger city")
        pool.append(f"small {who}")
    pool.extend(
        [
            f"{who} services",
            f"{who} businesses",
            f"independent {who}",
            f"{who} near me",
            f"{who} anywhere",
        ]
    )

    seen: set[str] = {original.lower()}
    suggestions: list[str] = []
    for item in pool:
        candidate = _text(item)
        if not candidate:
            continue
        lowered = candidate.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        suggestions.append(candidate)
        if len(suggestions) == 3:
            break
    # Deterministic last resort so the contract of exactly three always holds.
    filler = 1
    while len(suggestions) < 3:
        candidate = f"{who} {['options', 'listings', 'results'][min(filler - 1, 2)]}"
        filler += 1
        if candidate.lower() not in seen:
            seen.add(candidate.lower())
            suggestions.append(candidate)
    return suggestions[:3]


def to_preview_lead(raw: dict, why: str, source: str) -> dict:
    """The public preview shape: no email, no phone, no internal facts."""
    raw = raw or {}
    email = _text(raw.get("email"))
    return {
        "key": lead_key(email),
        "name": clean_person_name(raw.get("name")),
        "role": clean_role(raw.get("role") or raw.get("title")),
        "company": _clean_company(raw.get("company")),
        "city": _short_place(raw.get("city")) or None,
        "website": _clean_website(raw.get("website")) or None,
        "why": _text(why) or fallback_why(raw),
        "source": source if source in ("database", "live") else "database",
    }


def next_monday_8utc(now: datetime) -> datetime:
    """The next Monday 08:00 UTC that is strictly after ``now``."""
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    now = now.astimezone(timezone.utc)
    target = now.replace(hour=8, minute=0, second=0, microsecond=0)
    target += timedelta(days=(0 - now.weekday()) % 7)
    if target <= now:
        target += timedelta(days=7)
    return target


CSV_COLUMNS = ["name", "role", "company", "email", "phone", "website", "city", "why", "subject", "message"]
_CSV_INJECTION_PREFIXES = ("=", "+", "-", "@")


def _csv_safe(value: Any) -> str:
    text = "" if value is None else str(value)
    if text.startswith(_CSV_INJECTION_PREFIXES):
        return f"'{text}"
    return text


def export_csv(leads: list[dict]) -> str:
    """Kept leads only, one row each, safe to open in a spreadsheet."""
    buffer = io.StringIO()
    writer = csv.writer(buffer, lineterminator="\n")
    writer.writerow(CSV_COLUMNS)
    for lead in leads or []:
        if not isinstance(lead, dict) or lead.get("status") != "kept":
            continue
        message = lead.get("message") if isinstance(lead.get("message"), dict) else {}
        writer.writerow(
            _csv_safe(value)
            for value in (
                lead.get("name"),
                lead.get("role"),
                lead.get("company"),
                lead.get("email"),
                lead.get("phone"),
                lead.get("website"),
                lead.get("city"),
                lead.get("why"),
                message.get("subject"),
                message.get("body"),
            )
        )
    return buffer.getvalue()


# ---------------------------------------------------------------------------
# Facts and public shapes
# ---------------------------------------------------------------------------


def facts_from_candidate(raw: dict) -> dict:
    """Normalize one database/live record into the facts we are allowed to use."""
    raw = raw or {}
    email = _text(raw.get("email")).lower()
    category = _text(raw.get("category"))
    if category.lower() in IGNORED_CATEGORIES:
        category = ""
    return {
        "email": email,
        "name": clean_person_name(raw.get("name")),
        "role": clean_role(raw.get("role") or raw.get("title")),
        "company": _clean_company(raw.get("company")),
        "city": _short_place(raw.get("city")),
        "website": _clean_website(raw.get("website")),
        "category": category,
        "phone": clean_phone(raw.get("phone")),
        "rating": raw.get("rating"),
        "source": raw.get("source") if raw.get("source") in ("database", "live") else "database",
    }


def public_lead(lead: dict) -> dict:
    """Lead exactly as the API contract defines it."""
    preview = to_preview_lead(lead, _text(lead.get("why")), _text(lead.get("source")) or "database")
    message = lead.get("message") if isinstance(lead.get("message"), dict) else None
    return {
        **preview,
        "email": _text(lead.get("email")),
        "phone": _text(lead.get("phone")) or None,
        "status": lead.get("status") if lead.get("status") in ("pending", "kept", "skipped") else "pending",
        "message": message,
        "batch": int(lead.get("batch") or 1),
        "addedAt": _text(lead.get("addedAt")) or _now_iso(),
    }


def _lead_facts(lead: dict) -> dict:
    facts = lead.get("facts") if isinstance(lead.get("facts"), dict) else {}
    return {**facts, "why": lead.get("why"), "source": lead.get("source")}


def _make_lead(account_email: str, record: dict, batch: int, why: str | None = None) -> dict:
    email = _text(record.get("email")).lower()
    facts = {
        "name": record.get("name"),
        "role": record.get("role"),
        "company": record.get("company"),
        "city": record.get("city"),
        "website": record.get("website"),
        "category": record.get("category"),
        "rating": record.get("rating"),
        "email": email,
    }
    return {
        "key": lead_key(email),
        "account": account_email,
        "name": clean_person_name(record.get("name")),
        "role": clean_role(record.get("role")),
        "company": _clean_company(record.get("company")),
        "city": _text(record.get("city")) or None,
        "website": _clean_website(record.get("website")) or None,
        "why": _clip(why if why is not None else (record.get("why") or fallback_why(record)), 110),
        "source": record.get("source") if record.get("source") in ("database", "live") else "database",
        "email": email,
        "phone": _text(record.get("phone")) or None,
        "status": "pending",
        "message": None,
        "batch": int(batch),
        "addedAt": _now_iso(),
        "facts": facts,
    }


def public_account(account: dict) -> dict:
    email = _text(account.get("email")).lower()
    leads = finder_store.list_leads(email)
    counts = {
        "pending": sum(1 for lead in leads if lead.get("status") == "pending"),
        "kept": sum(1 for lead in leads if lead.get("status") == "kept"),
        "skipped": sum(1 for lead in leads if lead.get("status") == "skipped"),
    }
    return {
        "email": email,
        "describe": _text(account.get("describe")),
        "website": _text(account.get("website")) or None,
        "understood": account.get("understood") or {"who": "", "where": None, "offer": None},
        "autopilot": account.get("autopilot")
        or {"enabled": False, "count": 10, "weekday": "monday", "nextRunAt": None},
        "counts": counts,
        "createdAt": _text(account.get("createdAt")) or _now_iso(),
    }


# ---------------------------------------------------------------------------
# AI: provider resolution copied from ai.generate_draft, with a hard timeout
# ---------------------------------------------------------------------------


def _run_with_timeout(function: Callable[[], Any], timeout: float) -> Any:
    box: dict[str, Any] = {}

    def target() -> None:
        try:
            box["value"] = function()
        except BaseException as error:  # noqa: BLE001 - forwarded to the caller
            box["error"] = error

    thread = threading.Thread(target=target, daemon=True)
    thread.start()
    thread.join(timeout)
    if thread.is_alive():
        raise TimeoutError(f"AI call exceeded {timeout:.0f}s")
    if "error" in box:
        raise box["error"]
    return box.get("value")


def _ai_text(prompt: str) -> str:
    """Same provider resolution as ai.generate_draft, without build_prompt."""
    settings = service.get_settings()
    ai = settings.get("ai") or {}
    provider = ai.get("provider") or "gateway"

    if provider == "gateway":
        key = CONFIG.LITELLM_MASTER_KEY
        base = CONFIG.LITELLM_BASE_URL
        if not key:
            raise RuntimeError("AI gateway is not configured.")
        models = list(
            dict.fromkeys(
                [ai.get("model") or "gpt-oss-120b", *list_gateway_models(base, key), *GATEWAY_FALLBACK_MODELS]
            )
        )
        last_error: Exception = RuntimeError("AI gateway failed.")
        for model in models:
            try:
                return chat_via_openai(base, key, model, prompt)
            except Exception as error:  # try the next model
                last_error = error
        raise last_error

    if provider == "openai-compatible":
        key = ai.get("apiKey") or ""
        endpoint = ai.get("endpoint") or CONFIG.OPENAI_API_BASE or "https://api.openai.com/v1"
        if not key:
            raise RuntimeError("No AI provider key configured.")
        models = list(
            dict.fromkeys(
                [
                    ai.get("model") or "gpt-oss-120b",
                    *list_gateway_models(endpoint, key),
                    *GATEWAY_FALLBACK_MODELS,
                ]
            )
        )
        last_error = RuntimeError("AI provider failed for all fallback models.")
        for model in models:
            try:
                return chat_via_openai(endpoint, key, model, prompt)
            except Exception as error:
                last_error = error
        raise last_error

    key = ai.get("apiKey") or ""
    if not key:
        raise RuntimeError("No AI provider key configured.")
    models = list(dict.fromkeys([model for model in (ai.get("model"), "gemini-2.5-flash", "gemini-flash-latest") if model]))
    last_error = RuntimeError("Gemini provider failed.")
    for model in models:
        try:
            return chat_via_gemini(key, model, prompt)
        except Exception as error:
            last_error = error
    raise last_error


def _ai_json(prompt: str, purpose: str) -> dict:
    return _json_object(_run_with_timeout(lambda: _ai_text(prompt), _AI_TIMEOUTS[purpose]))


UNDERSTAND_PROMPT = """A solo founder typed one sentence describing the people they want to talk to:
"{describe}"

Turn it into search terms for a business lead database.

Return only one JSON object, no prose:
{{"who": "...", "where": "...", "offer": "..."}}

Rules:
- "who" is the kind of person or business in 1 to 5 words, with no place. Keep the founder's own trade words.
- "where" is the city, region or country if the sentence names one, otherwise null.
- "offer" is what the founder sells, but only if the sentence itself says it, written as one first-person
  sentence starting with "We" (e.g. "We build websites for dental clinics."). Otherwise null. Never guess.
- Do not add a subject or body key.
"""

SITE_PROMPT = """This text comes from the website of the person using our tool:
\"\"\"{text}\"\"\"

In one plain first-person sentence of at most 25 words starting with "We", say what they sell or do
(e.g. "We build websites for dental clinics."). Only what the text says.
Return only one JSON object, no prose: {{"offer": "..."}}
"""

PICK_PROMPT = """A solo founder wants to talk to: "{who}"{place}.
Candidates as JSON (1-based index):
{candidates}

Pick the best {limit} and write one short reason for each, using only facts that appear in that candidate's record.

Return only one JSON object, no prose:
{{"picks": [{{"index": 1, "why": "..."}}]}}

Rules for "why":
- Say why this person is worth contacting for that goal, in plain words: for example that they run
  the business (so they decide), or that their company is exactly the trade asked for. Do not just
  repeat their title and city back.
- At most 110 characters.
- Only facts from that record: role, company, city, category, website, rating.
- No invented funding, hiring, growth, awards, customers or intent.
- Do not name anyone who is not in that record.
- Plain words, no hype, no exclamation mark.
- "index" is the 1-based position in the candidate list.
"""

OFFER_PLACEHOLDER = "[One sentence on what you offer them]"

MESSAGE_PROMPT = """You write the first short email someone sends to one business contact they found.

What the founder sells: {offer}
The person (facts only): {facts}

Write the message.

Rules:
- 60 to 110 words.
- Plain text. No links, no markdown, no emojis, no bullet points, no hype.
- The first line is exactly "Hi <first name>," when the facts have a name, otherwise exactly "Hi there,".
- Never describe the sender (no "I'm a founder", no job titles); just say what they offer.
- Never mention past clients, examples, case studies, results or numbers: you do not know any.
- One specific observation taken from the facts above (role, company, city or category).
- Never invent a fact about the person or their business. You have NOT seen their website, reviews,
  work, team or customers: never describe, praise or judge them.
- Say what the founder offers in one or two plain sentences, using only what is written above. Do not
  add features, prices, results or details the founder did not give. No marketing words ("conversion-focused",
  "cutting-edge", "seamless", "boost", "growth", "transform").
- Separate the greeting, each paragraph, the question and "Best," with one blank line.
- One plain question near the end.
- The last line is exactly "Best," and nothing comes after it.

Return only one JSON object, no prose: {{"subject": "...", "body": "..."}}
"""


def _validate_understood(data: dict) -> dict:
    who = _text(data.get("who"))
    if not who:
        raise ValueError("missing who")
    if len(who) > 80 or len(who.split()) > 8:
        raise ValueError("who is too long")
    where_raw = data.get("where")
    where = _text(where_raw)
    if where.lower() in {"", "null", "none", "anywhere"}:
        where = ""
    if len(where) > 80:
        raise ValueError("where is too long")
    offer_raw = data.get("offer")
    offer = _text(offer_raw)
    if offer.lower() in {"", "null", "none"}:
        offer = ""
    if len(offer) > 240:
        raise ValueError("offer is too long")
    return {"who": who, "where": where or None, "offer": offer or None}


def understand(describe: str, website: str | None = None) -> dict:
    """AI first with a 10s cap; deterministic split when it fails or is slow."""
    understood: dict | None = None
    try:
        understood = _validate_understood(
            _ai_json(UNDERSTAND_PROMPT.format(describe=_text(describe)), "understand")
        )
    except Exception as error:  # noqa: BLE001 - any failure means fallback
        logger.info("Lead finder understanding fell back: %s", error)
        understood = None

    if not understood:
        understood = parse_describe_fallback(describe)

    if website and understood.get("offer") is None:
        try:
            summary = webpage.fetch_site_summary_text(website)
            if summary:
                offer_data = _ai_json(SITE_PROMPT.format(text=summary), "site")
                offer = _text(offer_data.get("offer"))
                if 3 <= len(offer) <= 240:
                    understood["offer"] = offer
        except Exception as error:  # noqa: BLE001 - the offer is optional
            logger.info("Website offer summary skipped: %s", error)
    return understood


def _candidate_prompt_entry(index: int, record: dict) -> dict:
    entry: dict[str, Any] = {"index": index}
    for key in ("name", "role", "company", "city", "category", "website", "rating"):
        value = record.get(key)
        if value not in (None, "", 0):
            entry[key] = value
    return entry


def _why_is_honest(why: str, record: dict) -> bool:
    lowered = why.lower()
    if any(word in lowered for word in FORBIDDEN_CLAIMS):
        return False
    facts_text = json.dumps(record, default=str, ensure_ascii=False).lower()
    names = re.findall(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b", why)
    for name in names:
        if name.lower() not in facts_text:
            return False
    return True


def choose_leads(records: list[dict], understood: dict, limit: int = PREVIEW_LEAD_COUNT) -> list[dict]:
    """One AI call picks and writes whys; deterministic ranking on any failure."""
    shortlist = [record for record in records if isinstance(record, dict)][:AI_SHORTLIST]
    if not shortlist:
        return []
    limit = max(1, min(int(limit or PREVIEW_LEAD_COUNT), len(shortlist)))

    prompt = PICK_PROMPT.format(
        who=_text(understood.get("who")) or "people",
        place=f" in {_text(understood.get('where'))}" if _text(understood.get("where")) else "",
        candidates=json.dumps([_candidate_prompt_entry(i + 1, r) for i, r in enumerate(shortlist)], ensure_ascii=False),
        limit=limit,
    )

    try:
        data = _ai_json(prompt, "pick")
        picks = data.get("picks")
        if not isinstance(picks, list):
            raise ValueError("missing picks")
        chosen: list[dict] = []
        used: set[int] = set()
        for pick in picks:
            if not isinstance(pick, dict):
                continue
            try:
                index = int(pick.get("index"))
            except (TypeError, ValueError):
                continue
            if index < 1 or index > len(shortlist) or index in used:
                continue
            record = shortlist[index - 1]
            why = _text(pick.get("why"))
            if not why:
                why = fallback_why(record)
            why = _clip(why, 110)
            if not _why_is_honest(why, record):
                why = fallback_why(record)
            used.add(index)
            chosen.append({**record, "why": why})
            if len(chosen) >= limit:
                break
        if len(chosen) < min(limit, len(shortlist)):
            for index, record in enumerate(shortlist, start=1):
                if index in used:
                    continue
                chosen.append({**record, "why": fallback_why(record)})
                if len(chosen) >= limit:
                    break
        return chosen
    except Exception as error:  # noqa: BLE001 - fallback is the contract
        logger.info("Lead finder AI pick fell back: %s", error)
        return [{**record, "why": fallback_why(record)} for record in shortlist[:limit]]


# ---------------------------------------------------------------------------
# Candidate collection
# ---------------------------------------------------------------------------


def is_clearly_outside_usa(where: str | None) -> bool:
    text = _text(where).lower()
    if not text:
        return False
    words = set(re.findall(r"[a-z.]+", text))
    if words & US_HINTS or text in US_HINTS or text in US_STATES:
        return False
    padded = f" {text} "
    if any(f" {state} " in padded for state in US_STATES):
        return False
    return any(f" {hint} " in padded for hint in NON_US_HINTS) or text in NON_US_HINTS


def _records_from_candidates(candidates: list[dict], source: str, who: str) -> list[dict]:
    records: list[dict] = []
    seen_emails: set[str] = set()
    for candidate in candidates:
        if not isinstance(candidate, dict):
            continue
        facts = facts_from_candidate({**candidate, "source": source})
        if not facts["email"] or not is_valid_email(facts["email"]):
            continue
        if not facts["company"]:
            continue
        if facts["email"] in seen_emails:
            continue
        seen_emails.add(facts["email"])
        facts["title"] = facts.get("role") or ""
        facts["why"] = fallback_why(facts)
        records.append(facts)
    return rank_candidates(records, who, AI_SHORTLIST)


def _live_records(who: str, where: str, started: float, deadline_seconds: float) -> list[dict]:
    if not service._coreclaw_configured():
        return []
    if time.monotonic() - started > deadline_seconds - 6:
        return []
    started_run = service._coreclaw_start(who, where, 25)
    run_slug = str((started_run or {}).get("runSlug") or "")
    if not run_slug:
        return []
    while time.monotonic() - started < deadline_seconds:
        remaining = deadline_seconds - (time.monotonic() - started)
        time.sleep(max(0.5, min(4.0, remaining)))
        try:
            result = service._coreclaw_poll(run_slug)
        except Exception as error:  # noqa: BLE001 - live search is best effort
            logger.warning("Live lead search poll failed: %s", error)
            raise GrowthcrewError("Live search is temporarily unavailable.", 502, "LIVE_UNAVAILABLE") from error
        status = result.get("status")
        if status == "completed":
            return [lead for lead in (result.get("leads") or []) if isinstance(lead, dict)]
        if status == "failed":
            raise GrowthcrewError("Live search could not complete.", 502, "LIVE_FAILED")
    raise GrowthcrewError("Live search took too long. Try again.", 504, "LIVE_TIMEOUT")


def _collect_records(understood: dict, wanted: int) -> list[dict]:
    """Database candidates for the sharpened search used by batches and digests.

    Live CoreClaw search is deliberately preview-only (spec §3): it costs money
    per run, and a weekly digest must never wait minutes for it or fan it out
    across accounts. If the database has nothing for this account, the batch is
    empty and the caller offers broader sentences instead.
    """
    who = _text(understood.get("who"))
    where = _text(understood.get("where"))
    outside = is_clearly_outside_usa(where)
    records: list[dict] = []

    if not outside and leadsdb.is_configured():
        try:
            candidates = leadsdb.search_dataset(
                _database_query(who), where, max(wanted * PREVIEW_CANDIDATE_FACTOR, 30)
            )
            records = _records_from_candidates(candidates, "database", who)
        except Exception as error:  # noqa: BLE001 - an empty batch is a valid answer
            logger.warning("Lead database search failed: %s", error)

    return records


def _merge_records(base: list[dict], extra: list[dict]) -> list[dict]:
    merged: list[dict] = []
    emails: set[str] = set()
    identities: set[str] = set()
    for record in [*base, *extra]:
        if not isinstance(record, dict):
            continue
        email = _text(record.get("email")).lower()
        keys = company_identity_keys(_text(record.get("company")), _text(record.get("website")), email)
        if not email or email in emails or any(key in identities for key in keys):
            continue
        emails.add(email)
        identities.update(keys)
        merged.append(record)
    return merged


# ---------------------------------------------------------------------------
# In-memory previews
# ---------------------------------------------------------------------------

_PREVIEWS: dict[str, dict] = {}
_PREVIEWS_LOCK = threading.RLock()


def _purge_previews() -> None:
    cutoff = time.time() - PREVIEW_TTL_SECONDS
    with _PREVIEWS_LOCK:
        for preview_id in [pid for pid, preview in _PREVIEWS.items() if preview.get("createdTs", 0) < cutoff]:
            _PREVIEWS.pop(preview_id, None)


def _get_preview(preview_id: str) -> dict | None:
    if not preview_id:
        return None
    with _PREVIEWS_LOCK:
        preview = _PREVIEWS.get(preview_id)
        if not preview:
            return None
        if preview.get("createdTs", 0) < time.time() - PREVIEW_TTL_SECONDS:
            _PREVIEWS.pop(preview_id, None)
            return None
        return preview


def _update_preview(preview_id: str, **fields: Any) -> None:
    with _PREVIEWS_LOCK:
        preview = _PREVIEWS.get(preview_id)
        if preview:
            preview.update(fields)


def preview_payload(preview_id: str) -> dict | None:
    preview = _get_preview(preview_id)
    if not preview:
        return None
    with _PREVIEWS_LOCK:
        return {
            "previewId": preview_id,
            "status": preview.get("status") or "running",
            "understood": preview.get("understood"),
            "leads": list(preview.get("leads") or []),
            "suggestions": list(preview.get("suggestions") or []),
            **({"error": preview["error"]} if preview.get("error") else {}),
        }


def start_preview(describe: str, website: str | None = None) -> str:
    _purge_previews()
    preview_id = uuid.uuid4().hex[:20]
    with _PREVIEWS_LOCK:
        _PREVIEWS[preview_id] = {
            "previewId": preview_id,
            "describe": _text(describe),
            "website": _text(website) or None,
            "status": "running",
            "understood": None,
            "leads": [],
            "records": [],
            "suggestions": [],
            "error": None,
            "createdTs": time.time(),
        }
    threading.Thread(target=_preview_worker, args=(preview_id,), daemon=True).start()
    return preview_id


def _preview_worker(preview_id: str) -> None:
    preview = _get_preview(preview_id)
    if not preview:
        return
    started = time.monotonic()
    try:
        understood = understand(preview["describe"], preview.get("website"))
        _update_preview(preview_id, understood=understood)

        who = _text(understood.get("who"))
        where = _text(understood.get("where"))
        outside = is_clearly_outside_usa(where)
        records: list[dict] = []
        source_failed = not (
            (not outside and leadsdb.is_configured()) or service._coreclaw_configured()
        )

        # 1. The database answers first, and the page shows those people while
        #    the (slower) live search is still running.
        if not outside and leadsdb.is_configured():
            try:
                candidates = leadsdb.search_dataset(
                    _database_query(who),
                    where,
                    max(PREVIEW_LEAD_COUNT * PREVIEW_CANDIDATE_FACTOR, 30),
                )
                records = _records_from_candidates(candidates, "database", who)
            except Exception as error:  # noqa: BLE001 - live search may still work
                source_failed = True
                logger.warning("Lead database search failed: %s", error)
            _publish_preview_records(preview_id, records)

        # 2. Live search only when the sentence is outside the USA or the
        #    database gave fewer than five good leads. One run, 50s overall cap.
        if (outside or len(records) < PREVIEW_LEAD_COUNT) and service._coreclaw_configured():
            try:
                live = _live_records(who, where, started, PREVIEW_MAX_SECONDS)
                records = _merge_records(records, _records_from_candidates(live, "live", who))
                _publish_preview_records(preview_id, records)
            except Exception as error:  # noqa: BLE001 - live search is best effort
                source_failed = True
                logger.warning("Live lead search failed: %s", error)

        # 3. One AI call picks the best five and writes the "why" lines.
        picked = choose_leads(records, understood, PREVIEW_LEAD_COUNT)
        if picked:
            _update_preview(
                preview_id,
                status="done",
                records=picked,
                leads=[
                    to_preview_lead(record, record.get("why") or fallback_why(record), record.get("source") or "database")
                    for record in picked
                ],
                suggestions=[],
            )
        elif source_failed:
            _update_preview(
                preview_id,
                status="failed",
                error="A search service is unavailable. We could not check for matches. Try again shortly.",
            )
        else:
            _update_preview(
                preview_id,
                status="empty",
                records=[],
                leads=[],
                suggestions=broader_suggestions(understood),
            )
    except Exception:  # noqa: BLE001 - status carries the message
        logger.exception("Lead finder preview failed")
        _update_preview(
            preview_id,
            status="failed",
            error="We could not finish this search. Try again in a moment.",
        )


def _publish_preview_records(preview_id: str, records: list[dict]) -> None:
    visible = records[:PREVIEW_LEAD_COUNT]
    if not visible:
        return
    _update_preview(
        preview_id,
        records=records,
        leads=[
            to_preview_lead(record, record.get("why") or fallback_why(record), record.get("source") or "database")
            for record in visible
        ],
    )


# ---------------------------------------------------------------------------
# Rate limits (in memory, per IP)
# ---------------------------------------------------------------------------

_RATE_LOCK = threading.RLock()
_RATE_EVENTS: dict[tuple[str, str], list[float]] = {}


def allow_request(bucket: str, ip: str, limit: int, window: int = RATE_WINDOW_SECONDS) -> bool:
    """Record one request; False when this IP already used ``limit`` in ``window``."""
    key = (bucket, ip or "unknown")
    now = time.time()
    with _RATE_LOCK:
        events = [stamp for stamp in _RATE_EVENTS.get(key, []) if stamp > now - window]
        if len(events) >= limit:
            _RATE_EVENTS[key] = events
            return False
        events.append(now)
        _RATE_EVENTS[key] = events
        for other in [k for k, v in _RATE_EVENTS.items() if not any(stamp > now - window for stamp in v)]:
            _RATE_EVENTS.pop(other, None)
        return True


# ---------------------------------------------------------------------------
# Accounts, tokens and sign-in codes
# ---------------------------------------------------------------------------


def _normalized_email(email: str) -> str:
    value = _text(email).lower()
    if not is_valid_email(value):
        raise GrowthcrewError("Enter a valid email address.", 400, "INVALID_EMAIL")
    return value


def account_for_token(token: str | None) -> dict | None:
    if not token:
        return None
    return finder_store.find_account_by_token_hash(_sha256_hex(token))


def create_account(email: str, preview_id: str | None = None, *, _password_verified: bool = False) -> dict:
    normalized = _normalized_email(email)
    if (not _password_verified and CONFIG.FINDER_TEST_PASSWORD_HASH
            and normalized == _text(CONFIG.FINDER_TEST_EMAIL).lower()):
        raise GrowthcrewError("Sign in to continue.", 409, "ACCOUNT_EXISTS")
    if finder_store.get_account(normalized):
        raise GrowthcrewError(
            "An account with this email already exists. Sign in instead.",
            409,
            "ACCOUNT_EXISTS",
        )

    preview = _get_preview(preview_id) if preview_id else None
    describe = _text(preview.get("describe")) if preview else ""
    understood = (preview or {}).get("understood") or parse_describe_fallback(describe)
    account = {
        "email": normalized,
        "describe": describe,
        "website": _text((preview or {}).get("website")) or None,
        "understood": understood,
        "autopilot": {"enabled": False, "count": 10, "weekday": "monday", "nextRunAt": None},
        "batchCounts": {},
        "runsTheCompany": False,
        "createdAt": _now_iso(),
    }
    finder_store.save_account(account)

    if preview:
        for record in (preview.get("records") or [])[:PREVIEW_LEAD_COUNT]:
            if not record.get("email"):
                continue
            finder_store.save_lead(_make_lead(normalized, record, 1, record.get("why")))

    token = secrets.token_urlsafe(32)
    finder_store.save_token(_sha256_hex(token), normalized)
    return {"account": public_account(account), "token": token}


def password_sign_in(email: str, password: str) -> dict:
    """Optional testing login, using a server-configured salted PBKDF2 hash.

    Format: pbkdf2_sha256$600000$<32 hex salt>$<64 hex digest>.
    There is no default testing account or password in application code.
    """
    normalized = _text(email).lower()
    configured_email = _text(CONFIG.FINDER_TEST_EMAIL).lower()
    configured_hash = _text(CONFIG.FINDER_TEST_PASSWORD_HASH)
    valid_config = False
    salt = bytes(16)
    expected = bytes(32)
    try:
        algorithm, rounds, salt_hex, digest_hex = configured_hash.split("$")
        if algorithm == "pbkdf2_sha256" and rounds == "600000":
            salt = bytes.fromhex(salt_hex)
            expected = bytes.fromhex(digest_hex)
            valid_config = len(salt) == 16 and len(expected) == 32 and is_valid_email(configured_email)
    except (ValueError, TypeError):
        pass
    # Perform the same expensive comparison for unknown emails or disabled config.
    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 600000)
    password_matches = hmac.compare_digest(actual, expected)
    email_matches = hmac.compare_digest(normalized.encode(), configured_email.encode())
    if not (valid_config and password_matches and email_matches):
        raise GrowthcrewError("Email or password is incorrect.", 401, "INVALID_CREDENTIALS")
    account = finder_store.get_account(normalized)
    if not account:
        return create_account(normalized, _password_verified=True)
    token = secrets.token_urlsafe(32)
    finder_store.save_token(_sha256_hex(token), normalized)
    return {"account": public_account(account), "token": token}


def request_sign_in(email: str, client_host: str | None = None) -> dict:
    """Always reports sent, whether or not the account exists."""
    normalized = _text(email).lower()
    if not is_valid_email(normalized):
        # Still 202 at the router level: no account enumeration.
        return {"sent": True}
    account = finder_store.get_account(normalized)
    if account:
        code = secrets.token_urlsafe(24)
        expires = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
        finder_store.save_code(normalized, _sha256_hex(code), expires)
        link = f"{CONFIG.FRONTEND_URL.rstrip('/')}/?signin={quote(code)}&email={quote(normalized)}"
        _send_sign_in_email(normalized, link, client_host)
    return {"sent": True}


def _is_local_host(host: str | None) -> bool:
    value = _text(host).lower()
    return value in {"127.0.0.1", "::1", "localhost", "testclient", "0.0.0.0"}


def is_local_host(host: str | None) -> bool:
    """Public alias used by the digest endpoint when no secret is configured."""
    return _is_local_host(host)


def _send_sign_in_email(email: str, link: str, client_host: str | None) -> bool:
    inbox = _text(CONFIG.FINDER_FROM_INBOX)
    if not inbox:
        logger.warning(
            "FINDER_FROM_INBOX is not set, so the sign-in email was not sent. "
            "Set it to an AgentMail inbox to send sign-in links."
        )
        if _is_local_host(client_host):
            logger.warning("Local development sign-in link for %s: %s", email, link)
        return False
    try:
        agentmail_request(
            f"/inboxes/{quote(inbox, safe='')}/messages/send",
            "POST",
            {
                "to": email,
                "subject": "Your GrowthCrew sign-in link",
                "text": (
                    "Open this link to sign in. It works once and expires in 30 minutes.\n\n"
                    f"{link}\n\n"
                    "If you did not ask for this, ignore the email."
                ),
            },
        )
        return True
    except Exception as error:  # noqa: BLE001 - never leak mailer details to the client
        logger.warning("Could not send the sign-in email: %s", error)
        return False


def verify_sign_in(email: str, code: str) -> dict:
    normalized = _text(email).lower()
    record = finder_store.get_code(normalized)
    invalid = GrowthcrewError("That sign-in link is not valid. Ask for a new one.", 401, "INVALID_CODE")
    if not record or record.get("used"):
        raise invalid
    expires = _parse_iso(record.get("expiresAt"))
    if not expires or expires <= datetime.now(timezone.utc):
        raise invalid
    if not hmac.compare_digest(str(record.get("codeHash") or ""), _sha256_hex(_text(code))):
        raise invalid
    account = finder_store.get_account(normalized)
    if not account:
        raise invalid
    finder_store.mark_code_used(normalized)
    token = secrets.token_urlsafe(32)
    finder_store.save_token(_sha256_hex(token), normalized)
    return {"account": public_account(account), "token": token}


# ---------------------------------------------------------------------------
# Leads, decisions and messages
# ---------------------------------------------------------------------------


def list_leads(account_email: str, status: str = "all") -> list[dict]:
    leads = finder_store.list_leads(account_email)
    if status in ("pending", "kept", "skipped"):
        leads = [lead for lead in leads if lead.get("status") == status]
    leads.sort(key=lambda lead: (int(lead.get("batch") or 1), _text(lead.get("addedAt"))), reverse=True)
    return [public_lead(lead) for lead in leads]


def _owned_lead(account_email: str, key: str) -> dict:
    lead = finder_store.get_lead(key)
    if not lead or lead.get("account") != _text(account_email).lower():
        raise GrowthcrewError("That person is no longer on your list. Reload the page.", 404, "LEAD_NOT_FOUND")
    return lead


def decide(account_email: str, key: str, decision: str) -> dict:
    lead = _owned_lead(account_email, key)
    if decision == "keep":
        if not lead.get("message"):
            account = finder_store.get_account(account_email) or {}
            lead["message"] = build_first_message(account, lead)
        lead["status"] = "kept"
    elif decision == "skip":
        # The message stays, so changing your mind later doesn't rewrite it.
        lead["status"] = "skipped"
    elif decision == "undo":
        lead["status"] = "pending"
    else:
        raise GrowthcrewError("That choice did not go through. Try again.", 400, "INVALID_DECISION")
    finder_store.save_lead(lead)
    return {"lead": public_lead(lead)}


def save_message(account_email: str, key: str, subject: str, body: str) -> dict:
    lead = _owned_lead(account_email, key)
    lead["message"] = {
        "subject": _clip(subject, 200),
        "body": str(body or "").strip(),
        "edited": True,
    }
    finder_store.save_lead(lead)
    return {"lead": public_lead(lead)}


def _message_facts(lead: dict) -> dict:
    facts = lead.get("facts") if isinstance(lead.get("facts"), dict) else {}
    return {
        key: value
        for key, value in {
            "name": lead.get("name"),
            "role": lead.get("role"),
            "company": lead.get("company"),
            "city": lead.get("city"),
            "website": lead.get("website"),
            "category": facts.get("category"),
        }.items()
        if value not in (None, "")
    }


def _message_is_valid(body: str, lead: dict) -> bool:
    text = str(body or "").strip()
    if not text:
        return False
    words = re.findall(r"\S+", text)
    if not 60 <= len(words) <= 110:
        return False
    lowered = text.lower()
    if any(token in lowered.replace(OFFER_PLACEHOLDER.lower(), "") for token in ("http://", "https://", "www.", "[")):
        return False
    if any(word in lowered for word in HYPE_WORDS):
        return False
    if any(phrase in lowered for phrase in UNSEEN_CLAIMS):
        return False
    if any(word in lowered for word in FORBIDDEN_CLAIMS):
        return False
    if "?" not in text:
        return False
    if not text.rstrip().endswith("Best,"):
        return False
    name = clean_person_name(lead.get("name"))
    first = first_name(name) if name else ""
    first_line = text.splitlines()[0].strip() if text else ""
    # "Zach," is a fine greeting that only lacks the "Hi".
    if re.fullmatch(r"[A-Z][\w'-]*,", first_line):
        return _message_is_valid(f"Hi {text}", lead)
    if first:
        if not first_line.lower().startswith("hi ") or first.lower() not in first_line.lower():
            return False
    else:
        if not first_line.lower().startswith("hi"):
            return False
    return True


def _fallback_message(account: dict, lead: dict) -> dict:
    understood = account.get("understood") if isinstance(account.get("understood"), dict) else {}
    offer = re.sub(r"https?://\S+", "", _text(understood.get("offer"))).strip(" .")[:200]
    name = clean_person_name(lead.get("name"))
    role = clean_role(lead.get("role"))
    company = _clean_company(lead.get("company"))
    city = _text(lead.get("city"))
    category = _text((lead.get("facts") or {}).get("category")) if isinstance(lead.get("facts"), dict) else ""

    greeting = f"Hi {first_name(name)}," if name else "Hi there,"
    if company and role:
        observation = (
            f"I came across {company}{f' in {city}' if city else ''} "
            f"and saw that you are listed as {role} there."
        )
    elif company:
        observation = f"I came across {company}{f' in {city}' if city else ''}."
    elif category:
        observation = f"I came across your {category} business."
    else:
        observation = "I came across your business."

    # Without a known offer we never guess what the user sells: the line is
    # left as a visible placeholder for them to fill in before sending.
    if offer and not re.match(r"(?i)(we|i|our|my)\b", offer):
        offer = f"We offer {offer[0].lower()}{offer[1:]}"
    offer_line = f"{offer[0].upper()}{offer[1:]}." if offer else OFFER_PLACEHOLDER
    body = "\n\n".join(
        [
            greeting,
            observation,
            offer_line,
            "Would a short call next week be useful? If it is not relevant, tell me and I will not follow up.",
            "Best,",
        ]
    )
    subject = f"Quick question about {company}" if company else "Quick question"
    return {"subject": _clip(subject, 90), "body": body, "edited": False}


def build_first_message(account: dict, lead: dict) -> dict:
    """AI first (25s cap), then a plain template that follows the same rules."""
    understood = account.get("understood") if isinstance(account.get("understood"), dict) else {}
    offer = _text(understood.get("offer")) or f"Unknown. Write this exact line where the offer goes: {OFFER_PLACEHOLDER}"
    facts = _message_facts(lead)
    try:
        data = _ai_json(
            MESSAGE_PROMPT.format(offer=_clip(offer, 240), facts=json.dumps(facts, ensure_ascii=False)),
            "message",
        )
        subject = _clip(_text(data.get("subject")), 90) or "Quick question"
        body = str(data.get("body") or "").strip()
        if re.match(r"[A-Z][\w'-]*,\s*\n", body):
            body = f"Hi {body}"
        if _message_is_valid(body, lead):
            return {"subject": subject, "body": body, "edited": False}
        logger.info("Lead finder message failed validation; using the template")
    except Exception as error:  # noqa: BLE001 - template fallback is the contract
        logger.info("Lead finder message fell back: %s", error)
    return _fallback_message(account, lead)


# ---------------------------------------------------------------------------
# Batches and sharpening
# ---------------------------------------------------------------------------


def _batch_number(account_email: str) -> int:
    numbers = [int(lead.get("batch") or 1) for lead in finder_store.list_leads(account_email)]
    return (max(numbers) + 1) if numbers else 1


def _consume_batch_quota(account: dict) -> None:
    if (CONFIG.FINDER_TEST_PASSWORD_HASH and CONFIG.FINDER_TEST_EMAIL
            and account.get("email") == _text(CONFIG.FINDER_TEST_EMAIL).lower()):
        return
    today = datetime.now(timezone.utc).date().isoformat()
    counts = account.get("batchCounts") if isinstance(account.get("batchCounts"), dict) else {}
    used = int(counts.get(today) or 0)
    if used >= BATCH_DAILY_LIMIT:
        raise GrowthcrewError(
            "You have reached today's limit of 20 searches. Try again tomorrow.",
            429,
            "BATCH_LIMIT",
        )
    counts[today] = used + 1
    account["batchCounts"] = counts


def start_batch(account_email: str, count: int, refine: dict | None = None) -> str:
    account = finder_store.get_account(account_email)
    if not account:
        raise GrowthcrewError("Sign in to continue.", 401, "UNAUTHORIZED")
    _consume_batch_quota(account)

    batch_id = uuid.uuid4().hex[:16]
    finder_store.save_batch(
        {
            "batchId": batch_id,
            "account": _text(account_email).lower(),
            "status": "running",
            "leads": [],
            "suggestions": [],
            "count": max(1, min(int(count or 10), 25)),
            "refine": refine,
            "createdAt": _now_iso(),
        }
    )
    finder_store.save_account(account)
    threading.Thread(target=_batch_worker, args=(batch_id,), daemon=True).start()
    return batch_id


def _apply_refine(account: dict, refine: dict | None) -> dict:
    understood = dict(account.get("understood") or {})
    refine = refine or {}
    changed = False

    who = _text(refine.get("who"))
    if who:
        understood["who"] = _clip(who, 80)
        changed = True
    where = refine.get("where")
    if where is not None:
        cleaned = _text(where)
        understood["where"] = cleaned or None
        changed = True
    if isinstance(refine.get("runsTheCompany"), bool):
        account["runsTheCompany"] = refine["runsTheCompany"]
        changed = True

    if changed:
        account["understood"] = understood
        finder_store.save_account(account)
    return understood


def _build_batch_leads(account: dict, wanted: int, refine: dict | None = None) -> tuple[list[dict], list[str], dict]:
    """Sharpened search: fetch, exclude, score, one per company, then one AI pick."""
    account_email = _text(account.get("email")).lower()
    understood = _apply_refine(account, refine)
    account = finder_store.get_account(account_email) or account
    runs_only = bool(account.get("runsTheCompany"))

    existing = finder_store.list_leads(account_email)
    excluded_emails = {_text(lead.get("email")).lower() for lead in existing if lead.get("email")}
    excluded_companies = {
        normalize_company_name(_clean_company(lead.get("company")))
        for lead in existing
        if _clean_company(lead.get("company"))
    }
    kept = [_lead_facts(lead) for lead in existing if lead.get("status") == "kept"]
    skipped = [_lead_facts(lead) for lead in existing if lead.get("status") == "skipped"]

    records = _collect_records(understood, wanted)

    scored: list[tuple[float, int, dict]] = []
    for index, record in enumerate(records):
        email = _text(record.get("email")).lower()
        company = _clean_company(record.get("company"))
        if not email or not company:
            continue
        if email in excluded_emails or normalize_company_name(company) in excluded_companies:
            continue
        if runs_only and not runs_the_company(record.get("role") or record.get("title")):
            continue
        score = score_candidate(record, kept, skipped)
        scored.append((score, index, record))

    scored.sort(key=lambda item: (-item[0], item[1]))

    companies: set[str] = set()
    shortlist: list[dict] = []
    for _score, _index, record in scored:
        identity = normalize_company_name(_clean_company(record.get("company")))
        if not identity or identity in companies:
            continue
        companies.add(identity)
        shortlist.append(record)
        if len(shortlist) >= AI_SHORTLIST:
            break

    picked = choose_leads(shortlist, understood, max(1, min(wanted, 25)))
    suggestions = [] if picked else broader_suggestions(understood)
    return picked, suggestions, understood


def _batch_worker(batch_id: str) -> None:
    batch = finder_store.get_batch(batch_id)
    if not batch:
        return
    try:
        account = finder_store.get_account(batch.get("account")) or {}
        wanted = int(batch.get("count") or 10)
        picked, suggestions, _understood = _build_batch_leads(account, wanted, batch.get("refine"))

        if picked:
            number = _batch_number(batch["account"])
            keys = []
            for record in picked:
                lead = _make_lead(batch["account"], record, number, record.get("why"))
                finder_store.save_lead(lead)
                keys.append(lead["key"])
            batch.update({"status": "done", "leads": keys, "suggestions": [], "batchNumber": number})
        else:
            batch.update({"status": "empty", "leads": [], "suggestions": suggestions})
        finder_store.save_batch(batch)
    except Exception as error:  # noqa: BLE001 - status carries the failure
        logger.exception("Lead finder batch failed")
        batch.update({"status": "failed", "error": str(error)[:200], "leads": [], "suggestions": []})
        finder_store.save_batch(batch)


def batch_payload(account_email: str, batch_id: str) -> dict:
    batch = finder_store.get_batch(batch_id)
    if not batch or batch.get("account") != _text(account_email).lower():
        raise GrowthcrewError("Batch not found.", 404, "BATCH_NOT_FOUND")
    leads = []
    for key in batch.get("leads") or []:
        lead = finder_store.get_lead(key)
        if lead and lead.get("account") == _text(account_email).lower():
            leads.append(public_lead(lead))
    payload = {
        "status": batch.get("status") or "running",
        "leads": leads,
        "suggestions": list(batch.get("suggestions") or []),
    }
    if batch.get("error"):
        payload["error"] = batch["error"]
    return payload


# ---------------------------------------------------------------------------
# Autopilot and digests
# ---------------------------------------------------------------------------


def set_offer(account_email: str, offer: str) -> dict:
    """Store what the user sells, and fill it into unedited first messages
    that still carry the placeholder line."""
    account = finder_store.get_account(account_email)
    if not account:
        raise GrowthcrewError("Sign in to continue.", 401, "UNAUTHORIZED")
    text = re.sub(r"https?://\S+", "", _text(offer)).strip(" .")
    if not 3 <= len(text) <= 200:
        raise GrowthcrewError("Describe what you offer in one short sentence.", 400, "INVALID_OFFER")
    if not re.match(r"(?i)(we|i|our|my)\b", text):
        text = f"We offer {text[0].lower()}{text[1:]}"
    sentence = f"{text[0].upper()}{text[1:]}."
    understood = account.get("understood") if isinstance(account.get("understood"), dict) else {}
    account["understood"] = {**understood, "offer": text}
    finder_store.save_account(account)
    for lead in finder_store.list_leads(account_email):
        message = lead.get("message")
        if isinstance(message, dict) and not message.get("edited") and OFFER_PLACEHOLDER in (message.get("body") or ""):
            message["body"] = message["body"].replace(OFFER_PLACEHOLDER, sentence)
            finder_store.save_lead(lead)
    return {"account": public_account(account)}


def set_autopilot(account_email: str, enabled: bool, count: int | None = None) -> dict:
    account = finder_store.get_account(account_email)
    if not account:
        raise GrowthcrewError("Sign in to continue.", 401, "UNAUTHORIZED")
    current = account.get("autopilot") if isinstance(account.get("autopilot"), dict) else {}
    wanted = int(count if count is not None else current.get("count") or 10)
    account["autopilot"] = {
        "enabled": bool(enabled),
        "count": max(5, min(wanted, 25)),
        "weekday": "monday",
        "nextRunAt": next_monday_8utc(datetime.now(timezone.utc)).isoformat() if enabled else None,
    }
    finder_store.save_account(account)
    return {"account": public_account(account)}


def _digest_leads(account: dict) -> tuple[list[dict], list[str]]:
    wanted = int(((account.get("autopilot") or {}).get("count")) or 10)
    picked, suggestions, _understood = _build_batch_leads(account, wanted)
    if not picked:
        return [], suggestions

    number = _batch_number(account["email"])
    leads: list[dict] = []
    keys: list[str] = []
    for record in picked:
        lead = _make_lead(account["email"], record, number, record.get("why"))
        finder_store.save_lead(lead)
        keys.append(lead["key"])
        leads.append(public_lead(lead))
    finder_store.save_batch(
        {
            "batchId": uuid.uuid4().hex[:16],
            "account": account["email"],
            "status": "done",
            "leads": keys,
            "suggestions": [],
            "count": len(keys),
            "batchNumber": number,
            "source": "autopilot",
            "createdAt": _now_iso(),
        }
    )
    return leads, suggestions


def _send_digest(account: dict, leads: list[dict]) -> bool:
    inbox = _text(CONFIG.FINDER_FROM_INBOX)
    if not inbox:
        logger.warning(
            "FINDER_FROM_INBOX is not set, so the digest for %s was not sent.",
            account.get("email"),
        )
        return False
    subject, text, html = render_digest(public_account(account), leads, CONFIG.FRONTEND_URL)
    agentmail_request(
        f"/inboxes/{quote(inbox, safe='')}/messages/send",
        "POST",
        {"to": account.get("email"), "subject": subject, "text": text, "html": html},
    )
    return True


def run_due_digests(now: datetime | None = None) -> dict:
    """Send every due weekly digest; used by the scheduler and /digests/run."""
    current = now or datetime.now(timezone.utc)
    if current.tzinfo is None:
        current = current.replace(tzinfo=timezone.utc)
    sent = 0
    skipped = 0

    for account in finder_store.list_accounts():
        autopilot = account.get("autopilot") if isinstance(account.get("autopilot"), dict) else {}
        if not autopilot.get("enabled"):
            continue
        next_run = _parse_iso(autopilot.get("nextRunAt"))
        if next_run and next_run > current:
            continue

        try:
            leads, _suggestions = _digest_leads(account)
            if _send_digest(account, leads):
                sent += 1
            else:
                skipped += 1
        except Exception as error:  # noqa: BLE001 - one account must not stop the rest
            logger.warning("Digest for %s failed: %s", account.get("email"), error)
            skipped += 1
        finally:
            account["autopilot"] = {
                **autopilot,
                "enabled": True,
                "count": int(autopilot.get("count") or 10),
                "weekday": "monday",
                "nextRunAt": next_monday_8utc(current).isoformat(),
            }
            finder_store.save_account(account)

    return {"sent": sent, "skipped": skipped}


_SCHEDULER_LOCK = threading.Lock()
_SCHEDULER_STARTED = False


def start_scheduler(interval_seconds: int = 30 * 60) -> None:
    """Start the weekly-digest checker once (FINDER_SCHEDULER=1)."""
    global _SCHEDULER_STARTED
    with _SCHEDULER_LOCK:
        if _SCHEDULER_STARTED:
            return
        _SCHEDULER_STARTED = True

    def loop() -> None:
        while True:
            try:
                result = run_due_digests()
                if result["sent"] or result["skipped"]:
                    logger.info("Lead finder digests: %s sent, %s skipped", result["sent"], result["skipped"])
            except Exception:  # noqa: BLE001 - keep the thread alive
                logger.exception("Lead finder digest scheduler failed")
            time.sleep(interval_seconds)

    threading.Thread(target=loop, name="finder-digest-scheduler", daemon=True).start()
    logger.info("Lead finder digest scheduler started (every %s minutes)", interval_seconds // 60)
