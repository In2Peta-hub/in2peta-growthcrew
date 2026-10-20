"""GrowthCrew lead database: the USA business leads dataset hosted on MotherDuck.

The dataset (~10.6M rows) lives in a handful of MotherDuck tables uploaded from
the mirrored Parquet tree: `companies`, `contacts` (person records), `linkedin`
(person records), `maps` (no emails) and `other`. This module searches the
tables that carry an email address and maps rows onto the GrowthCrew lead
shape, so results can be merged with the live CoreClaw search in service.py.

Config (fastapi-backend/.env):
    MOTHERDUCK_TOKEN=...           # app.motherduck.com -> Settings -> Access Tokens
    MOTHERDUCK_DATABASE=business_leads
"""

from __future__ import annotations

import re
import threading
from typing import Any

from config import CONFIG
from growthcrew.normalize import clean_phone, is_valid_email

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
HONORIFIC_RE = re.compile(r"^(?:mr|mrs|ms|miss|dr|prof|rev|sir|madam)\.?\s+", re.I)
PAREN_RE = re.compile(r"\s*\([^)]*\)")
STOPWORDS = {"a", "an", "and", "the", "in", "of", "at", "on", "for", "with", "near", "nearby", "around", "me", "my"}

# DuckDB connections are not safe for concurrent use; searches are serialized.
_lock = threading.RLock()
_connection_handle: Any = None

# Column order returned by every source query.
RESULT_COLUMNS = [
    "dataset", "name_a", "name_b", "title", "company", "phone", "address",
    "city", "state", "website", "category", "email_a", "email_b",
]

# Person/company tables that carry email addresses. `maps` is skipped on
# purpose: those rows (Google Maps scrapes) have no contact emails.
SOURCES: list[dict[str, str]] = [
    {
        "dataset": "contacts",
        "email_pred": "(email_a LIKE '%@%' OR email_b LIKE '%@%')",
        "inner": r"""
            SELECT
                'contacts' AS dataset,
                trim(concat_ws(' ',
                    NULLIF(trim("First Name"), ''),
                    NULLIF(trim("Middle Name"), ''),
                    NULLIF(trim("Last Name"), ''))) AS name_a,
                trim(concat_ws(' ',
                    NULLIF(trim("First Name.1"), ''),
                    NULLIF(trim("Middle Name.1"), ''),
                    NULLIF(trim("Last Name.1"), ''))) AS name_b,
                COALESCE("Title", '') AS title,
                COALESCE("Company Name", '') AS company,
                COALESCE("Phone", '') AS phone,
                COALESCE("Mailing Address", '') AS address,
                COALESCE("Primary City", '') AS city,
                COALESCE("Primary State", '') AS state,
                COALESCE("Web Address", '') AS website,
                trim(concat_ws(' / ',
                    NULLIF(trim("Industry"), ''),
                    NULLIF(trim("Sub Industry"), ''))) AS category,
                COALESCE("Email", '') AS email_a,
                COALESCE("Email.1", '') AS email_b,
                concat_ws(' ', "Company Name", "Industry", "Sub Industry", "Title") AS search_text,
                concat_ws(' ', "Primary City", "Primary State", "Mailing Address", "ZIP Code") AS location_text
            FROM "contacts"
        """,
    },
    {
        "dataset": "companies",
        "email_pred": "(email_a LIKE '%@%' OR email_b LIKE '%@%')",
        "inner": r"""
            SELECT
                'companies' AS dataset,
                regexp_replace(COALESCE("Contact Person", ''), '\s*\([^)]*\)', '') AS name_a,
                '' AS name_b,
                COALESCE(NULLIF(regexp_extract(COALESCE("Contact Person", ''), '\(([^)]*)\)', 1), ''),
                         'Owner / Representative') AS title,
                COALESCE("Business Name", '') AS company,
                COALESCE("Phone", '') AS phone,
                COALESCE("Street Address", '') AS address,
                COALESCE("City", '') AS city,
                COALESCE("State", '') AS state,
                COALESCE("Website", '') AS website,
                '' AS category,
                COALESCE("Corporate Email", '') AS email_a,
                COALESCE(NULLIF(trim("Email"), ''), NULLIF(trim(" Email"), ''),
                         NULLIF(trim("Generic Email"), ''), '') AS email_b,
                concat_ws(' ', "Business Name") AS search_text,
                concat_ws(' ', "City", "State", "Street Address", "Zip Code") AS location_text
            FROM "companies"
        """,
    },
    {
        "dataset": "linkedin",
        "email_pred": "(email_a LIKE '%@%')",
        "inner": r"""
            SELECT
                'linkedin' AS dataset,
                COALESCE("Full Name", '') AS name_a,
                '' AS name_b,
                COALESCE("Job Title", '') AS title,
                COALESCE("Company", '') AS company,
                COALESCE("Phone #1", '') AS phone,
                '' AS address,
                COALESCE("Location", '') AS city,
                '' AS state,
                COALESCE("Company Website", '') AS website,
                COALESCE("Industry", '') AS category,
                COALESCE(
                    NULLIF(trim("Work Email #1"), ''),
                    NULLIF(trim("Work Email #2"), ''),
                    NULLIF(trim("Work Email #3"), ''),
                    NULLIF(trim("Direct Email #1"), ''),
                    NULLIF(trim("Direct Email #2"), ''),
                    NULLIF(trim("Direct Email #3"), ''),
                    NULLIF(trim("Company Email"), ''), '') AS email_a,
                '' AS email_b,
                concat_ws(' ', "Company", "Industry", "Job Title") AS search_text,
                COALESCE("Location", '') AS location_text
            FROM "linkedin"
        """,
    },
]


def is_configured() -> bool:
    return bool(CONFIG.MOTHERDUCK_TOKEN and CONFIG.MOTHERDUCK_DATABASE)


def _connection():
    global _connection_handle
    import duckdb  # imported lazily so the backend runs without duckdb installed

    with _lock:
        if _connection_handle is None:
            _connection_handle = duckdb.connect(
                f"md:{CONFIG.MOTHERDUCK_DATABASE}",
                config={"motherduck_token": CONFIG.MOTHERDUCK_TOKEN},
            )
        return _connection_handle


def _tokens(text: Any) -> list[str]:
    """Lowercased search tokens; safe for direct SQL LIKE interpolation."""
    cleaned = re.sub(r"[^a-z0-9\s]", " ", str(text or "").lower())
    return [token for token in cleaned.split() if len(token) >= 2 and token not in STOPWORDS]


def _location_tokens(location: str) -> list[str]:
    # This dataset is entirely US-based. Country names identify its coverage,
    # not text that must appear in a city/state/address. Keep narrower places.
    location = re.sub(
        r"\b(?:united states(?: of america)?|u\.?s\.?a\.?|u\.?s\.?)\b\.?",
        " ", location, flags=re.I,
    )
    return _tokens(location)


def _or_predicate(column: str, tokens: list[str]) -> str:
    """True when ANY token matches — tolerant to partial queries."""
    if not tokens:
        return "TRUE"
    return "(" + " OR ".join(f"lower({column}) LIKE '%{token}%'" for token in tokens) + ")"


def _relevance_score(column: str, tokens: list[str]) -> str:
    """Rank rows that match MORE tokens higher (query and location both count)."""
    if not tokens:
        return "0"
    return " + ".join(f"(lower({column}) LIKE '%{token}%')::INT" for token in tokens)


def _source_sql(source: dict[str, str], query_tokens: list[str], location_tokens: list[str], limit: int) -> str:
    columns = ", ".join(RESULT_COLUMNS)
    where = " AND ".join(
        part
        for part in (
            source["email_pred"],
            _or_predicate("search_text", query_tokens),
            _or_predicate("location_text", location_tokens),
        )
        if part != "TRUE"
    ) or "TRUE"
    relevance = (
        f"({_relevance_score('search_text', query_tokens)} + "
        f"{_relevance_score('location_text', location_tokens)})"
    )
    return (
        f"SELECT {columns} FROM ("
        f"SELECT *, {relevance} AS relevance FROM ({source['inner']}) AS s "
        f"WHERE {where}"
        f") AS t ORDER BY relevance DESC LIMIT {int(limit)}"
    )


def _clean_name(value: Any) -> str:
    name = PAREN_RE.sub("", str(value or ""))
    name = name.replace(",", " ")
    name = HONORIFIC_RE.sub("", " ".join(name.split())).strip(" ,.-")
    return name


def _row_to_lead(row: dict[str, Any], index: int) -> dict | None:
    raw_email = f"{row.get('email_a') or ''} {row.get('email_b') or ''}"
    match = EMAIL_RE.search(raw_email)
    if not match:
        return None
    email = match.group(0).strip().lower()
    if not is_valid_email(email):
        return None

    company = str(row.get("company") or "").strip()
    name = _clean_name(row.get("name_a") or row.get("name_b") or "")
    if not company and not name:
        return None

    city = str(row.get("city") or "").strip()
    state = str(row.get("state") or "").strip()
    website = str(row.get("website") or "").strip()
    category = str(row.get("category") or "").strip()
    address = str(row.get("address") or "").strip()
    lead = {
        "id": index,
        "name": name or (f"{company} Owner" if company else "Team"),
        "email": email,
        "company": company or "Local Business",
        "title": str(row.get("title") or "").strip() or "Owner / Representative",
        "phone": clean_phone(row.get("phone")),
        "address": address,
        "website": website,
        "city": city,
        "category": category or "Business",
        "source": "lead-database",
        "raw": {
            "dataset": row.get("dataset"),
            "state": state,
            "city": city,
            "website": website,
            "industry": category,
            "address": address,
        },
    }
    return lead


def search_dataset(query: str, location: str, max_results: int) -> list[dict]:
    """Search the MotherDuck lead tables; returns GrowthCrew-shaped leads."""
    if not is_configured():
        return []
    wanted = max(int(max_results or 20), 1)
    limit = min(max(wanted * 3, 30), 300)
    query_tokens, location_tokens = _tokens(query), _location_tokens(location)

    rows: list[tuple] = []
    con = _connection()
    with _lock:
        for source in SOURCES:
            rows.extend(con.execute(_source_sql(source, query_tokens, location_tokens, limit)).fetchall())

    leads: list[dict] = []
    seen_emails: set[str] = set()
    for row in rows:
        lead = _row_to_lead(dict(zip(RESULT_COLUMNS, row)), len(leads))
        if not lead:
            continue
        email = lead["email"]
        if email in seen_emails:
            continue
        seen_emails.add(email)
        leads.append(lead)
        if len(leads) >= wanted:
            break
    return leads


def dataset_summary() -> dict:
    """Row counts per table, for the /leads/database health endpoint."""
    if not is_configured():
        return {"configured": False, "database": CONFIG.MOTHERDUCK_DATABASE, "tables": {}, "totalRows": 0}
    con = _connection()
    with _lock:
        tables = {
            name: con.execute(f'SELECT count(*) FROM "{name}"').fetchone()[0]
            for name in (row[0] for row in con.execute("SHOW TABLES").fetchall())
        }
    return {
        "configured": True,
        "database": CONFIG.MOTHERDUCK_DATABASE,
        "tables": tables,
        "totalRows": sum(tables.values()),
    }
