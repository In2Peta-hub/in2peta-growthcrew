"""Safe website fetch for the lead finder (docs/lead-finder-spec.md §5).

The user may hand us any URL when they describe their offer. We fetch it to
learn what they sell, so the fetch must never become a request for something
inside our own network:

- http and https only;
- resolve every host and reject private, loopback, link-local, multicast,
  reserved and unspecified addresses;
- re-check every redirect hop (at most 3);
- 5 second timeout, at most 512 KB, ``text/html`` only;
- return title + meta description + visible text, collapsed, at most 3,000
  characters.

A bad site is not an error for the caller: ``fetch_site_summary_text`` returns
"" and the flow continues without an offer.
"""

from __future__ import annotations

import ipaddress
import re
import socket
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit

MAX_BYTES = 512 * 1024
MAX_CHARS = 3000
MAX_REDIRECTS = 3
TIMEOUT_SECONDS = 5
USER_AGENT = "GrowthCrewLeadFinder/1.0 (+https://in2peta.io)"

_HTTP_SCHEMES = {"http", "https"}
_WHITESPACE_RE = re.compile(r"\s+")
_SKIP_TAGS = {"script", "style", "noscript", "template", "svg", "canvas", "iframe"}


def _is_public_address(value: str) -> bool:
    """True when an IP literal is globally routable and safe to contact."""
    try:
        address = ipaddress.ip_address(value.strip().strip("[]"))
    except ValueError:
        return False
    if (
        address.is_private
        or address.is_loopback
        or address.is_link_local
        or address.is_multicast
        or address.is_reserved
        or address.is_unspecified
    ):
        return False
    if isinstance(address, ipaddress.IPv6Address) and address.ipv4_mapped:
        return _is_public_address(str(address.ipv4_mapped))
    # is_global also rules out shared/carrier-grade NAT space (100.64.0.0/10).
    return address.is_global


def _host_from_input(value: str) -> str:
    """The host of a URL, or the input itself when it is a bare host/IP."""
    text = (value or "").strip()
    if not text:
        return ""
    if "://" in text:
        try:
            return (urlsplit(text).hostname or "").strip()
        except ValueError:
            return ""
    # A bare IPv6 literal arrives with brackets.
    if text.startswith("["):
        return text[1 : text.find("]")] if "]" in text else text.strip("[]")
    if text.count(":") > 1:
        return text  # bare IPv6 without brackets
    return text.split("/")[0].split(":")[0].strip()


def _resolve_is_public(host: str) -> bool:
    """Every address a host resolves to must be public."""
    try:
        results = socket.getaddrinfo(host, None)
    except (socket.gaierror, OSError, UnicodeError, ValueError):
        return False
    addresses = {result[4][0] for result in results if result and len(result) > 4}
    if not addresses:
        return False
    return all(_is_public_address(address) for address in addresses)


def is_public_url(value: str) -> bool:
    """True when a URL (or bare host/IP) points at a public address.

    Used by ``fetch_site_summary_text`` before every request and by the router
    when a user supplies their website. Hostnames are resolved and every
    returned address must be public; bare IP literals are checked directly
    without a DNS lookup.
    """
    host = _host_from_input(value)
    if not host:
        return False
    try:
        ipaddress.ip_address(host)
    except ValueError:
        return _resolve_is_public(host)
    return _is_public_address(host)


# The tests look for a public/private predicate by name; keep this alias so the
# name is obvious to a reader even though both call the same function.
is_safe_url = is_public_url


class _TextExtractor(HTMLParser):
    """Collect the title, meta description and visible text of an HTML page."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title_parts: list[str] = []
        self.description = ""
        self.text_parts: list[str] = []
        self._in_title = False
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs) -> None:
        tag = tag.lower()
        if tag in _SKIP_TAGS:
            self._skip_depth += 1
            return
        if tag == "title":
            self._in_title = True
            return
        if tag == "meta":
            values = {str(key).lower(): (value or "") for key, value in attrs}
            name = (values.get("name") or values.get("property") or "").lower()
            if name in {"description", "og:description", "twitter:description"} and not self.description:
                self.description = values.get("content") or ""

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in _SKIP_TAGS and self._skip_depth:
            self._skip_depth -= 1
            return
        if tag == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title_parts.append(data)
        elif self._skip_depth == 0 and data.strip():
            self.text_parts.append(data)


def _collapse(value: str) -> str:
    return _WHITESPACE_RE.sub(" ", value or "").strip()


def _decode(body: bytes, encoding: str | None) -> str:
    for candidate in (encoding, "utf-8", "latin-1"):
        if not candidate:
            continue
        try:
            return body.decode(candidate, errors="replace")
        except (LookupError, TypeError):
            continue
    return body.decode("utf-8", errors="replace")


def fetch_site_summary_text(url: str) -> str:
    """A short, safe summary of a public web page; "" when it cannot be read."""
    try:
        return _fetch_site_summary_text(url)
    except Exception:
        return ""


def _fetch_site_summary_text(url: str) -> str:
    import requests  # imported here so the module can be tested without network use

    current = (url or "").strip()
    if not current:
        return ""
    if "://" not in current:
        current = f"https://{current}"

    visited: set[str] = set()
    for _hop in range(MAX_REDIRECTS + 1):
        try:
            parsed = urlsplit(current)
        except ValueError:
            return ""
        if parsed.scheme.lower() not in _HTTP_SCHEMES:
            return ""
        if not parsed.hostname or current in visited:
            return ""
        visited.add(current)
        if not is_public_url(current):
            return ""

        response = requests.get(
            current,
            headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"},
            timeout=TIMEOUT_SECONDS,
            allow_redirects=False,
            stream=True,
        )
        try:
            if response.status_code in {301, 302, 303, 307, 308}:
                location = response.headers.get("location") or ""
                if not location:
                    return ""
                current = urljoin(current, location)
                continue
            if not response.ok:
                return ""

            content_type = (response.headers.get("content-type") or "").split(";")[0].strip().lower()
            if content_type and content_type not in {"text/html", "application/xhtml+xml"}:
                return ""

            chunks: list[bytes] = []
            total = 0
            for chunk in response.iter_content(chunk_size=16384):
                if not chunk:
                    continue
                chunks.append(chunk)
                total += len(chunk)
                if total >= MAX_BYTES:
                    break
            body = b"".join(chunks)[:MAX_BYTES]
        finally:
            response.close()

        if not body:
            return ""

        parser = _TextExtractor()
        parser.feed(_decode(body, response.encoding))
        parser.close()

        pieces: list[str] = []
        title = _collapse("".join(parser.title_parts))
        description = _collapse(parser.description)
        if title:
            pieces.append(title)
        if description and description.lower() != title.lower():
            pieces.append(description)
        text = _collapse(" ".join(parser.text_parts))
        if text:
            pieces.append(text)
        return " ".join(piece for piece in pieces if piece)[:MAX_CHARS].strip()

    return ""
