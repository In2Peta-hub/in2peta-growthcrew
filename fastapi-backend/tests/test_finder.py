"""Tests for the lead finder pure functions and router wiring.

Written against docs/lead-finder-spec.md §1-§5. Nothing here touches a real
network, MotherDuck, AgentMail/CoreClaw or an AI provider.
"""

import csv
import hashlib
import io
import os
import socket
import tempfile
from datetime import datetime, timedelta, timezone

os.environ["FINDER_DATA_FILE"] = tempfile.mktemp(suffix=".json")
os.environ["OUTREACH_DATA_FILE"] = tempfile.mktemp(suffix=".json")

import growthcrew.webpage as webpage
from growthcrew.finder import (
    broader_suggestions,
    clean_person_name,
    clean_role,
    export_csv,
    fallback_why,
    lead_key,
    next_monday_8utc,
    parse_describe_fallback,
    rank_candidates,
    runs_the_company,
    score_candidate,
    to_preview_lead,
)

from main import app


FORBIDDEN_WHY_WORDS = ("funding", "hiring", "raised", "growing")


def _candidate(name, title, company, email, city="Pune", category="Dental clinic"):
    return {
        "name": name,
        "title": title,
        "role": title,
        "company": company,
        "email": email,
        "city": city,
        "category": category,
        "website": "",
        "phone": "",
    }


# --- parse_describe_fallback ------------------------------------------------


def test_parse_simple_sentence():
    parsed = parse_describe_fallback("dentists in Pune")
    assert parsed["who"] == "dentists"
    assert parsed["where"] == "Pune"
    assert parsed["offer"] is None


def test_parse_where_absent():
    parsed = parse_describe_fallback("SaaS founders")
    assert parsed["who"] == "SaaS founders"
    assert parsed["where"] is None
    assert parsed["offer"] is None


def test_parse_splits_on_the_last_in():
    parsed = parse_describe_fallback("people in tech in Austin")
    assert parsed["who"] == "people in tech"
    assert parsed["where"] == "Austin"


def test_parse_near_and_around():
    for sentence in ("dentists near Pune", "dentists around Pune"):
        parsed = parse_describe_fallback(sentence)
        assert parsed["who"] == "dentists"
        assert parsed["where"] == "Pune"


def test_parse_trims_surrounding_whitespace():
    parsed = parse_describe_fallback("  dentists in Pune  ")
    assert parsed["who"] == "dentists"
    assert parsed["where"] == "Pune"


# --- lead_key ---------------------------------------------------------------


def test_lead_key_is_sha1_prefix():
    expected = hashlib.sha1(b"priya@example.com").hexdigest()[:16]
    assert lead_key("priya@example.com") == expected
    assert len(expected) == 16
    assert all(char in "0123456789abcdef" for char in expected)


def test_lead_key_is_case_and_space_insensitive():
    base = lead_key("priya@example.com")
    assert lead_key("Priya@Example.COM") == base
    assert lead_key("  priya@example.com  ") == base
    assert lead_key("priya@example.com") == base


# --- clean_person_name / clean_role ----------------------------------------


def test_clean_person_name_blank_values():
    assert clean_person_name(None) is None
    assert clean_person_name("") is None
    assert clean_person_name("   ") is None


def test_clean_person_name_removes_normalizer_defaults():
    for default in ("Team at Acme", "Team at Bright Smile Dental", "Acme Owner", "Acme Dental Owner", "Local Business"):
        assert clean_person_name(default) is None, default


def test_clean_person_name_keeps_real_names():
    assert clean_person_name("Priya Kulkarni") == "Priya Kulkarni"


def test_clean_role_blank_and_defaults():
    assert clean_role(None) is None
    assert clean_role("") is None
    assert clean_role("   ") is None
    assert clean_role("Owner / Representative") is None


def test_clean_role_keeps_real_titles():
    assert clean_role("Chief Executive Officer") == "Chief Executive Officer"
    assert clean_role("Dentist") == "Dentist"


# --- runs_the_company -------------------------------------------------------


def test_runs_the_company_true_for_owners():
    for role in (
        "Owner",
        "Founder",
        "Co-Founder",
        "CEO",
        "Chief Executive Officer",
        "President",
        "Principal",
        "Managing Director",
        "Partner",
    ):
        assert runs_the_company(role) is True, role


def test_runs_the_company_false_for_everyone_else():
    for role in ("Associate", "Landscape Architect", None, ""):
        assert runs_the_company(role) is False, role


# --- rank_candidates --------------------------------------------------------


def test_rank_candidates_one_person_per_company():
    candidates = [
        _candidate("Al Associate", "Associate", "Acme Dental", "al@acme.example"),
        _candidate("Bea Boss", "CEO", "Acme Dental", "bea@acme.example"),
        _candidate("Cal Owner", "Owner", "Beta Dental", "cal@beta.example"),
    ]
    ranked = rank_candidates(candidates, "dental", 10)
    companies = [candidate["company"] for candidate in ranked]
    assert len(companies) == len(set(companies)) == 2
    acme = next(candidate for candidate in ranked if candidate["company"] == "Acme Dental")
    # The person who runs the company wins inside a duplicate company.
    assert acme["name"] == "Bea Boss"


def test_rank_candidates_respects_limit_and_empty_input():
    candidates = [
        _candidate(f"Owner {index}", "Owner", f"{name} Dental", f"owner{index}@example.com")
        for index, name in enumerate(("Acme", "Beta", "Gamma", "Delta", "Epsilon"))
    ]
    assert len(rank_candidates(candidates, "dentists", 2)) == 2
    assert rank_candidates([], "dentists", 5) == []


def test_rank_candidates_prefers_a_ceo_over_an_associate():
    candidates = [
        _candidate("Al Associate", "Associate", "Acme Dental", "al@acme.example"),
        _candidate("Bea Boss", "CEO", "Beta Dental", "bea@beta.example"),
    ]
    ranked = rank_candidates(candidates, "dental", 5)
    assert ranked[0]["name"] == "Bea Boss"


def test_rank_candidates_prefers_query_matches():
    candidates = [
        _candidate("Cal Owner", "Owner", "Landscape Design Co", "cal@landscape.example", category="Landscaping"),
        _candidate("Dee Owner", "Owner", "Pune Dental Clinic", "dee@dental.example", category="Dental clinic"),
    ]
    ranked = rank_candidates(candidates, "dentists", 5)
    assert ranked[0]["name"] == "Dee Owner"


# --- fallback_why -----------------------------------------------------------


def test_fallback_why_uses_only_known_facts():
    why = fallback_why({"name": "Priya", "title": "Owner", "role": "Owner", "company": "Acme Dental", "city": "Pune"})
    assert len(why) <= 110
    assert "Acme Dental" in why
    assert "Owner" in why
    assert "Pune" in why


def test_fallback_why_never_invents_claims():
    why = fallback_why({"name": "Priya", "title": "Owner", "company": "Acme Dental", "city": "Pune"})
    lowered = why.lower()
    for word in FORBIDDEN_WHY_WORDS:
        assert word not in lowered, word


def test_fallback_why_survives_missing_role_and_city():
    why = fallback_why({"name": "Priya", "company": "Acme Dental", "title": None, "city": None})
    assert why
    assert "Acme Dental" in why
    assert "None" not in why
    assert " at ," not in why
    assert len(why) <= 110


def test_fallback_why_caps_long_facts():
    why = fallback_why(
        {
            "name": "Priya",
            "title": "Chief Executive Officer",
            "company": "A Very Long Dental Practice Name That Keeps Going And Going And Going And Going",
            "city": "Thiruvananthapuram",
        }
    )
    assert len(why) <= 110
    for word in FORBIDDEN_WHY_WORDS:
        assert word not in why.lower()


# --- score_candidate --------------------------------------------------------


def test_score_candidate_prefers_kept_similarity_over_skipped():
    candidate = _candidate("Dee Dentist", "Dentist", "Bright Smile Dental", "dee@bright.example", category="Dental clinic")
    kept = [
        {
            "name": "Kai",
            "title": "Dentist",
            "role": "Dentist",
            "company": "River Dental",
            "city": "Pune",
            "category": "Dental clinic",
        }
    ]
    skipped = [
        {
            "name": "Sam",
            "title": "Landscape Architect",
            "role": "Landscape Architect",
            "company": "Green Scapes",
            "city": "Boston",
            "category": "Landscaping",
        }
    ]
    assert score_candidate(candidate, kept, []) > score_candidate(candidate, [], skipped)


def test_score_candidate_handles_empty_lists():
    candidate = _candidate("Dee Dentist", "Dentist", "Bright Smile Dental", "dee@bright.example")
    score = score_candidate(candidate, [], [])
    assert isinstance(score, (int, float))


# --- broader_suggestions ----------------------------------------------------


def test_broader_suggestions_are_three_unique_phrasings():
    suggestions = broader_suggestions({"who": "dentists", "where": "Pune", "offer": None})
    assert len(suggestions) == 3
    assert len(set(suggestions)) == 3
    assert all(isinstance(item, str) and item.strip() for item in suggestions)


def test_broader_suggestions_differ_from_the_original_sentence():
    suggestions = broader_suggestions({"who": "dentists", "where": "Pune", "offer": None})
    original = "dentists in Pune".lower()
    assert all(item.strip().lower() != original for item in suggestions)


def test_broader_suggestions_work_without_a_place():
    suggestions = broader_suggestions({"who": "SaaS founders", "where": None, "offer": None})
    assert len(suggestions) == 3
    assert len(set(suggestions)) == 3


# --- to_preview_lead --------------------------------------------------------


def test_to_preview_lead_has_exactly_the_spec_keys():
    raw = {
        "name": "Priya Kulkarni",
        "title": "Owner",
        "company": "Acme Dental",
        "city": "Pune",
        "website": "https://acme.example",
        "email": "priya@acme.example",
        "category": "Dental clinic",
    }
    lead = to_preview_lead(raw, "Owner at Acme Dental, Pune", "database")
    assert set(lead) == {"key", "name", "role", "company", "city", "website", "why", "source"}
    assert lead["name"] == "Priya Kulkarni"
    assert lead["role"] == "Owner"
    assert lead["company"] == "Acme Dental"
    assert lead["city"] == "Pune"
    assert lead["website"] == "https://acme.example"
    assert lead["why"] == "Owner at Acme Dental, Pune"
    assert lead["source"] == "database"
    assert lead["key"] == lead_key("priya@acme.example")
    assert "email" not in lead


def test_to_preview_lead_nulls_normalizer_defaults():
    raw = {
        "name": "Team at Acme",
        "title": "Owner / Representative",
        "company": "Acme",
        "city": "",
        "website": "",
        "email": "hello@acme.example",
    }
    lead = to_preview_lead(raw, "Acme, your area", "live")
    assert lead["name"] is None
    assert lead["role"] is None
    assert lead["company"] == "Acme"
    assert lead["source"] == "live"
    assert "email" not in lead


# --- next_monday_8utc -------------------------------------------------------


def test_next_monday_from_monday_before_8am_is_today():
    now = datetime(2026, 10, 19, 7, 59, tzinfo=timezone.utc)  # Monday
    result = next_monday_8utc(now)
    assert result == datetime(2026, 10, 19, 8, 0, tzinfo=timezone.utc)
    assert result.utcoffset() == timedelta(0)
    assert result > now


def test_next_monday_from_exactly_8am_is_strictly_after():
    now = datetime(2026, 10, 19, 8, 0, tzinfo=timezone.utc)  # Monday
    result = next_monday_8utc(now)
    assert result == datetime(2026, 10, 26, 8, 0, tzinfo=timezone.utc)
    assert result > now


def test_next_monday_from_monday_after_8am_is_next_week():
    now = datetime(2026, 10, 19, 9, 0, tzinfo=timezone.utc)  # Monday
    result = next_monday_8utc(now)
    assert result == datetime(2026, 10, 26, 8, 0, tzinfo=timezone.utc)
    assert result > now


def test_next_monday_from_sunday_is_tomorrow():
    now = datetime(2026, 10, 25, 23, 30, tzinfo=timezone.utc)  # Sunday
    result = next_monday_8utc(now)
    assert result == datetime(2026, 10, 26, 8, 0, tzinfo=timezone.utc)
    assert result.weekday() == 0
    assert (result.hour, result.minute, result.second) == (8, 0, 0)
    assert result > now


# --- export_csv -------------------------------------------------------------


def _kept_lead(email, name="Priya Kulkarni", company="Acme Dental", subject="Quick question", body="Hi Priya"):
    return {
        "key": lead_key(email),
        "name": name,
        "role": "Owner",
        "company": company,
        "email": email,
        "phone": "+91 98765 43210",
        "website": "https://acme.example",
        "city": "Pune",
        "why": "Owner at Acme Dental, Pune",
        "source": "database",
        "status": "kept",
        "message": {"subject": subject, "body": body, "edited": False},
        "batch": 1,
        "addedAt": "2026-10-20T09:00:00Z",
    }


def test_export_csv_header_matches_the_contract():
    output = export_csv([_kept_lead("priya@acme.example")])
    rows = list(csv.reader(io.StringIO(output)))
    assert rows[0] == ["name", "role", "company", "email", "phone", "website", "city", "why", "subject", "message"]


def test_export_csv_writes_one_row_per_lead():
    output = export_csv([_kept_lead("a@acme.example"), _kept_lead("b@beta.example")])
    rows = list(csv.reader(io.StringIO(output)))
    assert len(rows) == 3  # header + two leads
    assert [row[3] for row in rows[1:]] == ["a@acme.example", "b@beta.example"]


def test_export_csv_quotes_commas_and_newlines():
    lead = _kept_lead(
        "priya@acme.example",
        company="Acme, Inc.",
        subject="Question, quick",
        body="Hi Priya,\nThanks for your time.",
    )
    output = export_csv([lead])
    rows = list(csv.reader(io.StringIO(output)))
    assert rows[1][2] == "Acme, Inc."
    assert rows[1][8] == "Question, quick"
    assert rows[1][9] == "Hi Priya,\nThanks for your time."


# --- webpage safety (§5) ----------------------------------------------------


def _address_predicate():
    """Find the module's public/private address predicate, whatever it is called."""
    preferred = (
        "is_public_url",
        "is_safe_url",
        "is_public_address",
        "is_safe_address",
        "is_public_host",
        "is_safe_host",
        "url_is_allowed",
    )
    for name in preferred:
        helper = getattr(webpage, name, None)
        if callable(helper):
            return helper
    for name in dir(webpage):
        if name.startswith("_"):
            continue
        helper = getattr(webpage, name)
        if not callable(helper):
            continue
        lowered = name.lower()
        if any(word in lowered for word in ("public", "safe", "allowed")):
            return helper
    return None


def test_webpage_rejects_private_addresses():
    helper = _address_predicate()
    assert helper is not None, "webpage.py has no public/private address predicate to test"

    private_addresses = ("127.0.0.1", "10.0.0.5", "192.168.1.10", "169.254.169.254", "::1")
    for address in private_addresses:
        assert not helper(address), address
        url = f"http://[{address}]/" if ":" in address else f"http://{address}/"
        try:
            assert not helper(url), url
        except (ValueError, TypeError):
            pass  # an address-only helper may reject URL input outright, which is also safe

    # The predicate must be able to say yes to a public literal address.
    assert helper("93.184.216.34") or helper("http://93.184.216.34/")


def test_fetch_site_summary_rejects_private_hosts(monkeypatch):
    monkeypatch.setattr(
        socket,
        "getaddrinfo",
        lambda *args, **kwargs: [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("127.0.0.1", 80))],
    )
    monkeypatch.setattr(socket, "gethostbyname", lambda *args, **kwargs: "127.0.0.1")
    assert webpage.fetch_site_summary_text("http://private.example/") == ""
    assert webpage.fetch_site_summary_text("http://169.254.169.254/latest/meta-data") == ""


def test_fetch_site_summary_rejects_non_http_schemes():
    assert webpage.fetch_site_summary_text("file:///etc/passwd") == ""
    assert webpage.fetch_site_summary_text("ftp://example.com/file") == ""


# --- router wiring ----------------------------------------------------------


def test_finder_router_paths_are_registered():
    paths = set(app.openapi()["paths"])
    assert "/api/finder/previews" in paths
    assert "/api/finder/accounts" in paths


# --- Regressions found in review (2026-10-20) --------------------------------

def test_merged_source_names_are_dropped():
    assert clean_person_name("John Schiro Kevin Murray") is None
    assert clean_person_name("Robert C. Harger Dr. David Jenkins") is None
    assert clean_person_name("Frank C. Reynolds") == "Frank C. Reynolds"


def test_vice_and_assistant_titles_do_not_run_the_company():
    assert runs_the_company("Vice President Air Force Business Development") is False
    assert runs_the_company("Assistant to the President") is False
    assert runs_the_company("Partnerships Manager") is False
    assert runs_the_company("Associate, Owner") is True
    assert runs_the_company("Managing Partner") is True


def test_trailing_article_in_company_names_moves_to_the_front():
    from growthcrew.finder import _clean_company

    assert _clean_company("Hills Dental Spa The") == "The Hills Dental Spa"
    assert _clean_company("Northpark Family Dental") == "Northpark Family Dental"


def test_fallback_message_never_guesses_the_users_offer():
    from growthcrew.finder import OFFER_PLACEHOLDER, _fallback_message

    lead = {"name": "Zach Muegge", "role": "President", "company": "Balcones Family Dental", "city": "Austin"}
    unknown = _fallback_message({"describe": "dentists in Austin", "understood": {"offer": None}}, lead)["body"]
    assert OFFER_PLACEHOLDER in unknown
    assert "dentists in Austin" not in unknown
    known = _fallback_message({"understood": {"offer": "We build websites for dental clinics"}}, lead)["body"]
    assert "We build websites for dental clinics." in known
    assert known.rstrip().endswith("Best,")


def test_messages_that_describe_unseen_things_are_rejected():
    from growthcrew.finder import _message_is_valid

    lead = {"name": "Joseph Booth"}
    body = ("Hi Joseph,\n\nI noticed your current site presents your services clearly. " + "word " * 60
            + "\n\nWould a call help?\n\nBest,")
    assert _message_is_valid(body, lead) is False


def test_messages_that_invent_past_clients_are_rejected():
    from growthcrew.finder import _message_is_valid

    lead = {"name": "Zach Muegge"}
    body = ("Hi Zach,\n\nWe build fast websites for dental clinics. I can share examples of similar clinics we have helped. "
            + "word " * 50 + "\n\nWould a call help?\n\nBest,")
    assert _message_is_valid(body, lead) is False


def test_set_offer_fills_placeholder_in_unedited_messages(tmp_path, monkeypatch):
    from growthcrew import finder, finder_store

    email = "offer-test@example.com"
    finder_store.save_account({"email": email, "describe": "dentists in Austin", "understood": {"who": "dentists", "where": "Austin", "offer": None}})
    finder_store.save_lead({"key": "k-offer-1", "account": email, "email": "a@b.example", "status": "kept",
                            "message": {"subject": "s", "body": f"Hi,\n\n{finder.OFFER_PLACEHOLDER}\n\nBest,", "edited": False}})
    finder_store.save_lead({"key": "k-offer-2", "account": email, "email": "c@d.example", "status": "kept",
                            "message": {"subject": "s", "body": f"Mine\n\n{finder.OFFER_PLACEHOLDER}", "edited": True}})
    result = finder.set_offer(email, "websites for dental clinics")
    assert result["account"]["understood"]["offer"] == "We offer websites for dental clinics"
    assert "We offer websites for dental clinics." in finder_store.get_lead("k-offer-1")["message"]["body"]
    assert finder.OFFER_PLACEHOLDER in finder_store.get_lead("k-offer-2")["message"]["body"]


def test_relevance_matches_whole_words_only():
    beads = _candidate("Lian Ya", "President", "Occidentalbeads", "lian@beads.example", city="Austin", category="Manufacturing")
    clinic = _candidate("Zach Muegge", "President", "Balcones Family Dental", "zach@balcones.example", city="Austin", category="Dental")
    ranked = rank_candidates([beads, clinic], "dentists", 5)
    assert ranked[0]["company"] == "Balcones Family Dental"
