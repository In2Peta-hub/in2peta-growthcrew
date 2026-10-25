"""Tests for the weekly autopilot digest (growthcrew/digest_email.py).

Written against docs/lead-finder-spec.md §1, §3 and §4. No network, no mailbox,
no clock: the renderer is a pure function of (account, leads, review_url).
"""

import html
import re

from growthcrew.digest_email import autopilot_off_url, render_digest

REVIEW_URL = "https://app.example.com/finder/review"

ACCOUNT = {
    "email": "founder@example.com",
    "describe": "dentists in Pune",
    "website": None,
    "understood": {"who": "dentists", "where": "Pune", "offer": None},
    "autopilot": {"enabled": True, "count": 10, "weekday": "monday", "nextRunAt": "2026-10-26T08:00:00Z"},
    "counts": {"pending": 2, "kept": 1, "skipped": 0},
    "createdAt": "2026-10-01T09:00:00Z",
}


def _lead(**overrides) -> dict:
    lead = {
        "key": "0123456789abcdef",
        "name": "Priya Kulkarni",
        "role": "Owner",
        "company": "Acme Dental",
        "city": "Pune",
        "website": "https://acme.example",
        "why": "Owner at Acme Dental, Pune",
        "source": "database",
        "email": "priya@acme.example",
        "phone": "+91 98765 43210",
        "status": "pending",
        "message": None,
        "batch": 2,
        "addedAt": "2026-10-19T08:00:00Z",
    }
    lead.update(overrides)
    return lead


def _anchors(html_body: str) -> list[str]:
    return re.findall(r"<a\s[^>]*>.*?</a>", html_body, re.S)


def _visible_text(html_body: str) -> str:
    """Strip tags and entities so the prose can be checked on its own."""
    text = re.sub(r"<[^>]+>", " ", html_body)
    return text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&#x27;", "'")


# --- subject ---------------------------------------------------------------


def test_subject_is_plural_for_many_leads():
    subject, _, _ = render_digest(ACCOUNT, [_lead(), _lead(name="Arjun Mehta")], REVIEW_URL)
    assert subject == "2 people to talk to this week"


def test_subject_is_singular_for_one_lead():
    subject, _, _ = render_digest(ACCOUNT, [_lead()], REVIEW_URL)
    assert subject == "1 person to talk to this week"


def test_subject_for_zero_leads():
    subject, _, _ = render_digest(ACCOUNT, [], REVIEW_URL)
    assert subject == "No new people this week"


def test_subject_counts_the_leads():
    leads = [_lead(name=f"Person {index}") for index in range(10)]
    subject, _, _ = render_digest(ACCOUNT, leads, REVIEW_URL)
    assert subject == "10 people to talk to this week"


# --- opening line ----------------------------------------------------------


def test_opening_line_uses_the_account_sentence():
    _, text, html_body = render_digest(ACCOUNT, [_lead(), _lead(name="Arjun Mehta")], REVIEW_URL)
    expected = "Here are 2 new people for “dentists in Pune”. Keep the ones you like; we'll write the first message."
    assert expected in text
    assert expected in _visible_text(html_body)


def test_opening_line_is_singular_for_one_lead():
    _, text, _ = render_digest(ACCOUNT, [_lead()], REVIEW_URL)
    assert "Here is 1 new person for “dentists in Pune”." in text
    assert "Keep the one you like" in text


def test_opening_line_survives_a_missing_sentence():
    _, text, _ = render_digest({"email": "founder@example.com"}, [_lead()], REVIEW_URL)
    assert "Here is 1 new person" in text


# --- one entry per lead ----------------------------------------------------


def test_every_lead_gets_an_entry():
    _, text, html_body = render_digest(
        ACCOUNT,
        [_lead(), _lead(name="Arjun Mehta", role="Dentist", company="Bright Smile", city="Mumbai")],
        REVIEW_URL,
    )
    assert "Priya Kulkarni" in text
    assert "Arjun Mehta" in text
    assert "Owner at Acme Dental, Pune" in text
    assert "Bright Smile" in text
    assert "Priya Kulkarni" in html_body
    assert "Arjun Mehta" in html_body


def test_entry_shows_role_company_and_city_when_known():
    _, text, _ = render_digest(ACCOUNT, [_lead()], REVIEW_URL)
    assert "Owner · Acme Dental · Pune" in text


def test_lead_without_a_name_shows_the_company():
    _, text, _ = render_digest(
        ACCOUNT,
        [_lead(name=None, role="Owner", company="Acme Dental", city="Pune", why="Runs the practice on her own.")],
        REVIEW_URL,
    )
    assert "Acme Dental" in text
    assert text.count("Acme Dental") == 1
    assert "Owner · Pune" in text


def test_missing_role_and_city_leave_no_none_and_no_dangling_separator():
    _, text, html_body = render_digest(
        ACCOUNT,
        [_lead(role=None, city=None)],
        REVIEW_URL,
    )
    assert "None" not in text
    assert "None" not in html_body
    assert " · ·" not in text
    assert " · ·" not in html_body
    assert "Acme Dental" in text


def test_missing_company_leaves_no_dangling_separator():
    _, text, _ = render_digest(ACCOUNT, [_lead(company=None, role=None, city=None)], REVIEW_URL)
    assert " · " not in text
    assert "None" not in text


# --- html escaping ---------------------------------------------------------


def test_html_escapes_a_script_like_lead_name():
    _, _, html_body = render_digest(ACCOUNT, [_lead(name="<script>alert(1)</script>")], REVIEW_URL)
    assert "<script>" not in html_body
    assert "&lt;script&gt;alert(1)&lt;/script&gt;" in html_body


def test_html_escapes_an_ampersand_in_the_company():
    _, _, html_body = render_digest(ACCOUNT, [_lead(company="Bright & Smile")], REVIEW_URL)
    assert "Bright & Smile" not in html_body
    assert "Bright &amp; Smile" in html_body


def test_html_escapes_the_sentence_from_the_account():
    account = dict(ACCOUNT, describe='dentists in "Pune" & around')
    _, _, html_body = render_digest(account, [_lead()], REVIEW_URL)
    assert '"Pune"' not in html_body
    assert "&quot;Pune&quot;" in html_body
    assert "around" in html_body


# --- links -----------------------------------------------------------------


def test_off_link_uses_a_question_mark_when_there_is_no_query():
    off_url = autopilot_off_url(REVIEW_URL)
    assert off_url == REVIEW_URL + "?autopilot=off"
    _, text, html_body = render_digest(ACCOUNT, [_lead()], REVIEW_URL)
    assert off_url in text
    assert f'href="{off_url}"' in html_body


def test_off_link_uses_an_ampersand_when_the_url_has_a_query():
    review_url = "https://app.example.com/finder/review?batch=2"
    off_url = autopilot_off_url(review_url)
    assert off_url == review_url + "&autopilot=off"
    _, text, html_body = render_digest(ACCOUNT, [_lead()], review_url)
    assert off_url in text
    # In HTML the ampersand is escaped, the link target itself is unchanged.
    assert f'href="{html.escape(off_url, quote=True)}"' in html_body


def test_exactly_one_link_to_the_review_url_as_the_main_button():
    _, _, html_body = render_digest(ACCOUNT, [_lead(), _lead(name="Arjun Mehta")], REVIEW_URL)
    anchors = _anchors(html_body)
    buttons = [anchor for anchor in anchors if f'href="{REVIEW_URL}"' in anchor]
    assert len(buttons) == 1
    assert "Keep or skip them" in buttons[0]
    assert "background:#9702fa" in buttons[0]
    assert "color:#ffffff" in buttons[0]
    assert "border-radius:4px" in buttons[0]


def test_the_only_other_link_is_the_way_out():
    _, _, html_body = render_digest(ACCOUNT, [_lead()], REVIEW_URL)
    anchors = _anchors(html_body)
    assert len(anchors) == 2
    footer = [anchor for anchor in anchors if "Turn off weekly emails" in anchor]
    assert len(footer) == 1
    assert f'href="{REVIEW_URL}?autopilot=off"' in footer[0]
    assert "#9702fa" not in footer[0]


def test_the_off_link_does_not_shadow_the_button():
    _, _, html_body = render_digest(ACCOUNT, [_lead()], REVIEW_URL)
    assert html_body.count("#9702fa") == 1


def test_footer_lines_are_present():
    _, text, html_body = render_digest(ACCOUNT, [_lead()], REVIEW_URL)
    assert "You get this every Monday because you turned it on." in text
    assert "You get this every Monday because you turned it on." in _visible_text(html_body)
    assert "Turn off weekly emails" in text
    assert "Turn off weekly emails" in _visible_text(html_body)


# --- no contact details in the digest ---------------------------------------


def test_no_email_address_or_phone_number_in_the_digest():
    leads = [
        _lead(email="priya@acme.example", phone="+91 98765 43210"),
        _lead(name="Arjun Mehta", email="arjun@brightsmile.example", phone="020 5555 1234"),
    ]
    _, text, html_body = render_digest(ACCOUNT, leads, REVIEW_URL)
    for secret in ("priya@acme.example", "arjun@brightsmile.example", "+91 98765 43210", "020 5555 1234"):
        assert secret not in text, secret
        assert secret not in html_body, secret
    assert "@" not in text
    assert "@" not in html_body
    assert "98765" not in text
    assert "5555" not in html_body


# --- text version ----------------------------------------------------------


def test_text_version_writes_the_urls_out():
    _, text, _ = render_digest(ACCOUNT, [_lead()], REVIEW_URL)
    assert f"Keep or skip them: {REVIEW_URL}" in text
    assert f"Turn off weekly emails: {REVIEW_URL}?autopilot=off" in text
    assert "<" not in text or "<a " not in text


def test_text_version_has_no_html_tags():
    _, text, _ = render_digest(ACCOUNT, [_lead()], REVIEW_URL)
    assert "<a " not in text
    assert "<div" not in text
    assert "<p>" not in text


# --- html rules ------------------------------------------------------------


def test_html_has_no_images_scripts_or_external_css():
    _, _, html_body = render_digest(ACCOUNT, [_lead()], REVIEW_URL)
    assert "<img" not in html_body
    assert "<script" not in html_body
    assert "<style" not in html_body
    assert "<link" not in html_body
    assert "url(" not in html_body


def test_html_is_a_single_narrow_column():
    _, _, html_body = render_digest(ACCOUNT, [_lead()], REVIEW_URL)
    assert "max-width:600px" in html_body


def test_html_uses_the_font_stack_with_hanken_grotesk_first():
    _, _, html_body = render_digest(ACCOUNT, [_lead()], REVIEW_URL)
    assert "Hanken Grotesk" in html_body
    stack = html_body[html_body.index("font-family:") : html_body.index("font-family:") + 120]
    assert stack.index("Hanken Grotesk") < stack.index("Arial")


def test_html_uses_ink_on_white_with_muted_secondary_text():
    _, _, html_body = render_digest(ACCOUNT, [_lead()], REVIEW_URL)
    assert "#160c22" in html_body
    assert "#6b6178" in html_body
    assert "background:#ffffff" in html_body


def test_html_has_no_emoji_and_no_all_caps():
    _, text, html_body = render_digest(ACCOUNT, [_lead()], REVIEW_URL)
    prose = text + _visible_text(html_body)
    for character in prose:
        code = ord(character)
        assert not (0x1F300 <= code <= 0x1FAFF), character
        assert not (0x2600 <= code <= 0x27BF), character
    assert re.search(r"\b[A-Z]{3,}\b", prose) is None


# --- zero leads ------------------------------------------------------------


def test_zero_leads_suggests_changing_the_sentence():
    _, text, html_body = render_digest(ACCOUNT, [], REVIEW_URL)
    assert "No new people this week" in text
    assert "Change your sentence" in text
    assert REVIEW_URL in text
    assert "Change your sentence" in _visible_text(html_body)
    assert "Keep or skip them" not in text


def test_zero_leads_still_has_one_button_and_the_way_out():
    _, _, html_body = render_digest(ACCOUNT, [], REVIEW_URL)
    anchors = _anchors(html_body)
    assert len(anchors) == 2
    buttons = [anchor for anchor in anchors if f'href="{REVIEW_URL}"' in anchor]
    assert len(buttons) == 1
    assert "Change your sentence" in buttons[0]
    assert "background:#9702fa" in buttons[0]


def test_zero_leads_has_no_empty_entry_blocks():
    _, _, html_body = render_digest(ACCOUNT, [], REVIEW_URL)
    assert "border-bottom" not in html_body
