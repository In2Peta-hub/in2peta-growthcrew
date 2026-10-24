"""Weekly autopilot digest email: subject, plain text and inline-styled HTML.

Built for the GrowthCrew lead finder (docs/lead-finder-spec.md §4). In the
autopilot step the email *is* the product: it lists the new people and sends the
reader to the review page to keep or skip them.

Rules that shape this module:
- Plain words. No jargon, no shouting, no emoji.
- Only facts we have: name (or company when there is no person), role, company,
  city, and the "why" line.
- No email addresses and no phone numbers. Contact details live on the review page.
- One action link (the review page) and one honest way out (turn off weekly emails).
- HTML: inline styles only, one column of at most 600px, dark ink on white, and
  violet #9702fa only on the single button.

Standard library only.
"""

from __future__ import annotations

import html
import urllib.parse

INK = "#160c22"
MUTED = "#6b6178"
ACCENT = "#9702fa"
WHITE = "#ffffff"
RULE = "#e6e1ee"
FONT_STACK = "'Hanken Grotesk',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
SEPARATOR = " · "
MAX_WIDTH = "600px"

FOOTER_LINE = "You get this every Monday because you turned it on."
OFF_LABEL = "Turn off weekly emails"
KEEP_LABEL = "Keep or skip them"
CHANGE_LABEL = "Change your sentence"


def _clean(value: object) -> str:
    """Trimmed text for any value; missing or blank values become an empty string."""
    if value is None:
        return ""
    if not isinstance(value, str):
        value = str(value)
    return value.strip()


def _esc(value: str) -> str:
    """Escape a value for safe use in HTML text and attributes."""
    return html.escape(value, quote=True)


def autopilot_off_url(review_url: str) -> str:
    """The review URL with the autopilot flag, keeping any existing query string."""
    url = _clean(review_url)
    if urllib.parse.urlsplit(url).query:
        return url + "&autopilot=off"
    if "?" in url:
        # The URL already ends with a question mark, so no second one is needed.
        return url + "autopilot=off"
    return url + "?autopilot=off"


def _lead_parts(lead: dict) -> tuple[str, str, str]:
    """(headline, details, why) for one lead, skipping the parts we do not have.

    The headline is the person's name, or the company when the record has no
    person. The details line holds the role, the company and the city, joined
    with a middle dot so a missing part never leaves a dangling separator.
    """
    name = _clean(lead.get("name"))
    company = _clean(lead.get("company"))
    role = _clean(lead.get("role"))
    city = _clean(lead.get("city"))
    why = _clean(lead.get("why"))

    headline = name or company or "Unnamed company"
    details: list[str] = []
    if role:
        details.append(role)
    if company and company != headline:
        details.append(company)
    if city:
        details.append(city)
    return headline, SEPARATOR.join(details), why


def _render_text(
    intro: str,
    entries: list[tuple[str, str, str]],
    cta_label: str,
    review_url: str,
    off_url: str,
) -> str:
    """The same content as the HTML, as plain text with the URLs written out."""
    blocks = [intro]
    for headline, details, why in entries:
        block = [headline]
        if details:
            block.append(details)
        if why:
            block.append(why)
        blocks.append("\n".join(block))
    blocks.append(f"{cta_label}: {review_url}")
    blocks.append(FOOTER_LINE)
    blocks.append(f"{OFF_LABEL}: {off_url}")
    return "\n\n".join(blocks) + "\n"


def _render_html(
    subject: str,
    intro: str,
    entries: list[tuple[str, str, str]],
    cta_label: str,
    review_url: str,
    off_url: str,
) -> str:
    """One column of inline-styled HTML. No images, no external CSS, no scripts."""
    parts: list[str] = []
    parts.append("<!doctype html>")
    parts.append('<html lang="en">')
    parts.append("<head>")
    parts.append('<meta charset="utf-8">')
    parts.append(f"<title>{_esc(subject)}</title>")
    parts.append("</head>")
    parts.append(f'<body style="margin:0;padding:0;background:{WHITE};">')
    parts.append(
        f'<div style="max-width:{MAX_WIDTH};margin:0 auto;padding:24px 20px;'
        f"background:{WHITE};color:{INK};font-family:{FONT_STACK};font-size:16px;"
        'line-height:1.5;-webkit-text-size-adjust:100%;">'
    )
    parts.append(f'<p style="margin:0 0 20px 0;color:{INK};font-size:16px;line-height:1.5;">{_esc(intro)}</p>')

    for headline, details, why in entries:
        parts.append(f'<div style="margin:0 0 18px 0;padding:0 0 16px 0;border-bottom:1px solid {RULE};">')
        parts.append(
            f'<p style="margin:0 0 4px 0;color:{INK};font-size:17px;line-height:1.4;font-weight:600;">{_esc(headline)}</p>'
        )
        if details:
            parts.append(f'<p style="margin:0 0 6px 0;color:{MUTED};font-size:14px;line-height:1.4;">{_esc(details)}</p>')
        if why:
            parts.append(f'<p style="margin:0;color:{INK};font-size:15px;line-height:1.5;">{_esc(why)}</p>')
        parts.append("</div>")

    parts.append('<p style="margin:26px 0 18px 0;">')
    parts.append(
        f'<a href="{_esc(review_url)}" style="display:inline-block;background:{ACCENT};color:{WHITE};'
        'border-radius:4px;padding:12px 20px;font-size:16px;font-weight:600;line-height:1.2;text-decoration:none;">'
        f"{_esc(cta_label)}</a>"
    )
    parts.append("</p>")
    parts.append(f'<p style="margin:0 0 6px 0;color:{MUTED};font-size:13px;line-height:1.5;">{FOOTER_LINE}</p>')
    parts.append(
        f'<p style="margin:0;color:{MUTED};font-size:13px;line-height:1.5;">'
        f'<a href="{_esc(off_url)}" style="color:{MUTED};text-decoration:underline;">{OFF_LABEL}</a></p>'
    )
    parts.append("</div>")
    parts.append("</body>")
    parts.append("</html>")
    return "\n".join(parts) + "\n"


def render_digest(account: dict, leads: list[dict], review_url: str) -> tuple[str, str, str]:
    """Render the weekly digest for one account.

    Returns (subject, text, html). The digest carries no email address and no
    phone number: the reader keeps or skips people on the review page.
    """
    account = account or {}
    entries = [_lead_parts(lead) for lead in (leads or []) if isinstance(lead, dict)]
    count = len(entries)
    review_url = _clean(review_url)
    off_url = autopilot_off_url(review_url)
    describe = _clean(account.get("describe")) or "your search"

    if count == 0:
        subject = "No new people this week"
        intro = (
            f"No new people this week for “{describe}”. "
            "We could not find anyone new for that sentence. "
            "Change your sentence to look for a different group or place."
        )
        cta_label = CHANGE_LABEL
    elif count == 1:
        subject = "1 person to talk to this week"
        intro = (
            f"Here is 1 new person for “{describe}”. "
            "Keep the one you like; we'll write the first message."
        )
        cta_label = KEEP_LABEL
    else:
        subject = f"{count} people to talk to this week"
        intro = (
            f"Here are {count} new people for “{describe}”. "
            "Keep the ones you like; we'll write the first message."
        )
        cta_label = KEEP_LABEL

    text = _render_text(intro, entries, cta_label, review_url, off_url)
    html_body = _render_html(subject, intro, entries, cta_label, review_url, off_url)
    return subject, text, html_body
