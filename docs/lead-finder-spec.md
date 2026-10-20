# GrowthCrew lead finder: v1 flow spec

Owner and reviewer: the lead agent of this thread. Every work package below is built against this
document. If something here is wrong or impossible, say so in your final report instead of
silently doing something else.

## 1. The product in one line

The tool answers one question: **"Who should I talk to next?"** Everything else is hidden or does
not exist in v1.

```
Describe ──▶ Preview ──▶ Sign up ──▶ Review ──▶ Autopilot
one sentence  5 free leads  email only  keep or skip  weekly digest
(effort)      (VALUE)       (effort)    (VALUE)       (VALUE)
```

1. **Describe.** One input box in plain language ("dentists in Pune", "SaaS founders in Austin").
   Optional: their own website, so we can work out what they sell. No filter panel, no profile form.
2. **Preview.** Five real leads before signup. Each card: name, role, company, and one line on why
   they fit. Must land in under a minute (database results first, live results stream in).
3. **Sign up.** Email only, asked only now. The preview is saved, so it feels like continuing.
4. **Review.** One list, one decision per lead: keep or skip. Kept leads get a ready-written first
   message the user can edit, copy, or open in Gmail. Each keep or skip quietly sharpens the next
   batch.
5. **Autopilot.** "Send me 10 more like these every Monday." The email digest becomes the product.
   One "Connect" button exports kept leads (CSV, which Google Sheets and every CRM import).

Rules that override everything else:
- **Value before commitment.** Never ask for an account or setup step before showing results.
- **One screen, one primary action.** Two equal buttons on a screen means one belongs elsewhere.
- **Their words, not ours.** Never on screen: ICP, enrichment, sequence(s), pipeline, campaign,
  persona, funnel, prospect(ing), outreach automation, leverage, supercharge. Use what a solo founder
  would say to a friend: "people to talk to", "keep", "skip", "message", "more like these".
- **Defaults over settings.** Advanced options sit behind a small "Refine" link, phrased as
  questions ("Only people who run the company?").
- **Graceful dead ends.** No results means suggested broader phrasings, never an empty table.
- **Honesty.** Never claim data we don't have. The "why" line uses only facts in the lead record
  (role, company, category, city, website, rating). No invented funding, hiring, growth, or intent.
  If a record has no person name, show the company and no fake name. If the role is unknown, show
  no role (the existing normalizers insert "Owner / Representative" and "Team at X" as defaults:
  treat those as unknown).

Cut from v1 UI (backend endpoints may stay; the screens go): dashboards, analytics, campaign
builders, inbox management, sending from AgentMail inboxes, reply threads, tags, custom fields,
team permissions, AI settings. Social Studio stays reachable for signed-in users from the account
menu only; it is not part of this flow or the landing page story.

## 2. What the data really is (measured 2026-10-20)

- **Lead database** (`growthcrew/leadsdb.py`, MotherDuck): ~10.6M **USA** records with real person
  names, titles, companies, cities, websites, emails. First query after start ~16s (connection
  warm-up), then ~1s. Relevance is noisy: a "dentist Austin" search returned a landscape architect
  at a dental practice. **Ranking and filtering are required**: fetch 5–6x candidates, prefer
  people who run things (owner, founder, CEO, president, principal, managing director, partner,
  practice owner, dentist/doctor for clinics), one person per company, drop titles unrelated to the
  query.
- **Live search** (CoreClaw Google Maps, `service._coreclaw_start/_coreclaw_poll`): worldwide,
  businesses with an email, usually no person name. Takes 30s to several minutes. Costs money per
  run: never start it without rate limiting.
- **AI** (`growthcrew/ai.py`): `chat_via_openai` / `chat_via_gemini` and the provider resolution in
  `generate_draft`. The existing `build_prompt` is In2Peta-specific: **do not use it** for this
  flow. Messages here are about the *user's* business.
- **Email out** (`growthcrew/agentmail.py`): AgentMail can send from an inbox GrowthCrew owns. Used
  only for system mail (sign-in links, Monday digests), never to email leads.

## 3. API contract (`/api/finder`, new router `routers/finder_router.py`)

All JSON. Errors use the app's envelope `{"error", "code", "detail"}`. Authenticated endpoints need
header `X-Finder-Token: <token>`; the server stores only a SHA-256 of tokens.

### Types

```ts
Understood = { who: string, where: string | null, offer: string | null }

PreviewLead = {
  key: string,              // stable: sha1(email)[:16]
  name: string | null,      // null when the record has no real person name
  role: string | null,      // null when unknown or a normalizer default
  company: string,
  city: string | null,
  website: string | null,
  why: string,              // one line, ≤ 110 chars, facts only
  source: "database" | "live"
}

Lead = PreviewLead & {
  email: string,
  phone: string | null,
  status: "pending" | "kept" | "skipped",
  message: { subject: string, body: string, edited: boolean } | null,  // set when kept
  batch: number,            // 1 = the preview
  addedAt: string           // ISO
}

Account = {
  email: string,
  describe: string, website: string | null, understood: Understood,
  autopilot: { enabled: boolean, count: number, weekday: "monday", nextRunAt: string | null },
  counts: { pending: number, kept: number, skipped: number },
  createdAt: string
}

Refine = {
  who?: string,             // "Who exactly?" (rewrites understood.who)
  where?: string,           // "Somewhere else?" (rewrites understood.where)
  runsTheCompany?: boolean  // "Only people who run the company?"
}
```

### Endpoints

| Method + path | Auth | Body | Returns |
| --- | --- | --- | --- |
| `POST /api/finder/previews` | none, rate-limited (6/hour/IP) | `{describe: string (3–200 chars), website?: string}` | `202 {previewId, status:"running"}` |
| `GET /api/finder/previews/{previewId}` | none | | `{previewId, status:"running"\|"done"\|"empty"\|"failed", understood, leads: PreviewLead[] (0–5, grows while running), suggestions: string[], error?: string}` |
| `POST /api/finder/accounts` | none | `{email, previewId?}` | New email: `201 {account, token}` (preview leads become batch 1, pending). Existing email: `409 {code:"ACCOUNT_EXISTS"}` and the client calls `/sessions`. |
| `POST /api/finder/sessions` | none, rate-limited | `{email}` | Always `202 {sent: true}` (no account enumeration). If the account exists, emails a sign-in link `FRONTEND_URL/?signin=<code>&email=<email>` (code: one-time, 30 min). |
| `POST /api/finder/sessions/verify` | none | `{email, code}` | `{account, token}` or 401 |
| `GET /api/finder/me` | token | | `{account}` |
| `PUT /api/finder/me` | token | `{offer: string (3–200)}` | `{account}`. Stores what the user sells (first person) and fills it into unedited messages that still carry the placeholder line. |
| `GET /api/finder/leads?status=pending\|kept\|skipped\|all` | token | | `{leads: Lead[]}` newest batch first |
| `POST /api/finder/leads/{key}/decision` | token | `{decision:"keep"\|"skip"\|"undo"}` | `{lead}`. Keep writes the first message (AI, ≤ 30s, template fallback). Undo puts the lead back to pending. Skipping keeps any written message. |
| `PUT /api/finder/leads/{key}/message` | token | `{subject, body}` | `{lead}` (`edited: true`) |
| `POST /api/finder/batches` | token, ≤ 20/day/account | `{count?: 10, refine?: Refine}` | `202 {batchId}` |
| `GET /api/finder/batches/{batchId}` | token | | `{status:"running"\|"done"\|"empty"\|"failed", leads: Lead[], suggestions: string[]}` |
| `PUT /api/finder/autopilot` | token | `{enabled: boolean, count?: number (5–25)}` | `{account}` |
| `GET /api/finder/export.csv` | token (header only, so it never lands in access logs; the client downloads via fetch + blob) | | CSV of kept leads: name, role, company, email, phone, website, city, why, subject, message |
| `POST /api/finder/digests/run` | header `X-Digest-Secret` = `FINDER_DIGEST_SECRET` (if unset: localhost only) | | `{sent: n, skipped: n}` |

### Behaviour

- **Understanding the sentence**: AI turns `describe` into `Understood` (`who` = search terms,
  `where` = place or null, `offer` = null unless the sentence says what the user sells). Fallback
  without AI: split on the last ` in ` / ` near ` / ` around `. If `website` is given, fetch it
  safely (see §5) and set `offer` to one plain sentence on what they sell.
- **Preview search**: database search immediately (US data; skip if `where` is clearly outside the
  USA); live search in parallel when `where` is outside the USA or the database gives < 5 good
  leads. The poll endpoint returns leads as soon as each source lands. Stop at 5 good leads or 50
  seconds, then `done` (or `empty` with 3 broader phrasings: drop the qualifier, widen the place,
  use a plainer trade word).
- **Choosing the five**: rank candidates (§2), then one AI call picks the best N and writes each
  `why` from the facts JSON. Validate the AI output (indices in range, why ≤ 110 chars, no names
  that aren't in the facts); fall back to the deterministic ranking and a template `why`
  ("{role} at {company}, {city}" style, only with known parts).
- **Sharpening**: each account keeps the facts of kept and skipped leads. New batches fetch
  candidates for `understood`, exclude every email and company already shown, then score: +
  similarity (title/category/city tokens) to kept leads, − similarity to skipped leads, + runs the
  company. Deterministic and unit-tested (`score_candidate`).
- **First message** (on keep): about the user's `offer` (or `describe` if no offer), grounded only
  in lead facts. 60–110 words, plain text, greeting with first name when known, one specific
  observation from the facts, one plain question, ends with "Best,". No links, no claims about the
  lead that aren't in the facts, no hype words.
- **Autopilot**: a background thread (enabled when `FINDER_SCHEDULER=1`) checks every 30 min, and
  `/digests/run` does the same on demand (for Render cron). For each enabled account whose
  `nextRunAt` has passed: find `count` new leads with the sharpened search, add them as a pending
  batch, email the digest (subject: "10 people to talk to this week", list of name/role/company/why,
  one link "Keep or skip them" to `FRONTEND_URL`), set `nextRunAt` to next Monday 08:00 UTC.
  Sent from AgentMail inbox `FINDER_FROM_INBOX`.
- **Persistence**: `JsonStore("finder.json", ..., env_var="FINDER_DATA_FILE")`, guarded by a lock,
  like `store.py`. Previews are kept in memory for 24 h, then dropped.

New env vars (document in `.env.example` and `render.yaml` if present): `FINDER_FROM_INBOX`,
`FINDER_DIGEST_SECRET`, `FRONTEND_URL` (default `http://localhost:5173`), `FINDER_SCHEDULER`.

## 4. Backend module layout (pure functions are unit-tested)

```
fastapi-backend/growthcrew/finder_store.py   # JsonStore wrapper: accounts, leads, tokens, codes, feedback
fastapi-backend/growthcrew/finder.py         # the logic below
fastapi-backend/growthcrew/webpage.py        # safe fetch + text extraction (§5)
fastapi-backend/growthcrew/digest_email.py   # render_digest(...) -> (subject, text, html)
fastapi-backend/routers/finder_router.py     # HTTP surface, rate limits
fastapi-backend/tests/test_finder.py         # tests for the pure functions + router wiring
```

Pure functions in `finder.py` (exact names and signatures; tests are written against them):

```python
def parse_describe_fallback(describe: str) -> dict            # -> {"who", "where", "offer": None}
def lead_key(email: str) -> str                              # sha1(email.lower().strip())[:16]
def clean_person_name(name: str | None) -> str | None        # None for "Team at X", "X Owner", empty
def clean_role(title: str | None) -> str | None              # None for "Owner / Representative", empty
def runs_the_company(role: str | None) -> bool
def rank_candidates(candidates: list[dict], who: str, limit: int) -> list[dict]  # relevance + seniority, one per company
def fallback_why(lead: dict) -> str                          # facts only, ≤ 110 chars
def score_candidate(candidate: dict, kept: list[dict], skipped: list[dict]) -> float
def broader_suggestions(understood: dict) -> list[str]       # exactly 3, all different from the input
def to_preview_lead(raw: dict, why: str, source: str) -> dict
def next_monday_8utc(now: datetime) -> datetime              # strictly after now
def export_csv(leads: list[dict]) -> str
```

`digest_email.py`: `render_digest(account: dict, leads: list[dict], review_url: str) -> tuple[str, str, str]`
returns `(subject, text, html)`. HTML: inline styles only, a single column ≤ 600px, dark ink on
white, violet `#9702fa` only on the one link, no images, no tracking pixels, no unsubscribe claims
we can't honour (include "Turn off weekly emails" link to `review_url + "?autopilot=off"`).

## 5. Safe website fetch (`webpage.py`)

`fetch_site_summary_text(url: str) -> str`: http/https only; resolve the host and reject private,
loopback, link-local, multicast and reserved addresses (check every redirect hop, max 3); 5s
timeout; read at most 512 KB; only `text/html`; return title + meta description + visible text,
collapsed, max 3,000 chars. Never raise to the caller for a bad site: return "" and let the flow
continue without an offer.

## 6. Frontend layout

Design language: `client/src/ui/ui.css`, `client/src/ui/Segmented.jsx`, `docs/app-design-brief.md`
(read both). The landing page follows the taste-skill house rules already applied there: no
eyebrows, no gradients, no shadows at rest, no tiny caps labels, no icon-card grids, headlines ≤ 2
lines, body ≥ 16px, sentence case. Motion per Emil Kowalski: transform/opacity only, ease-out
`cubic-bezier(0.23,1,0.32,1)`, press `scale(.97)`, hover gated to fine pointers, reduced-motion
fallbacks, nothing animates on frequent actions except press feedback.

```
client/src/finder/finderApi.js       # (lead agent) contract client + session storage + mock mode
client/src/finder/DescribeBox.jsx    # (B1) step 1
client/src/finder/PreviewList.jsx    # (B1) step 2: 5 cards, skeletons while running, empty state
client/src/finder/SaveStep.jsx       # (B1) step 3: email only, inline after the preview
client/src/LandingPage.jsx/.css      # (B1) landing rebuilt around steps 1–3
client/src/finder/ReviewScreen.jsx   # (B2) step 4 + 5 on one screen
client/src/finder/LeadRow.jsx        # (B2) keep / skip, message editor, copy, open in Gmail
client/src/finder/RefineLink.jsx     # (B2) "Refine" questions
client/src/finder/AutopilotCard.jsx  # (B2) "Send me 10 more like these every Monday" + Connect
client/src/finder/finder.css         # (B2) shared finder styles, layered as components
client/src/App.jsx, LoginPage.jsx    # (B2) routing: finder session = signed-in user; sign-in link flow
```

`finderApi.js` exposes: `startPreview`, `getPreview`, `createAccount`, `requestSignIn`,
`verifySignIn`, `me`, `listLeads`, `decide`, `saveMessage`, `startBatch`, `getBatch`,
`setAutopilot`, `exportUrl`, plus `session` helpers (`getSession`, `setSession`, `clearSession`,
`savePendingPreview`, `takePendingPreview`). Mock mode: `localStorage.gc_finder_mock = "1"` or
`VITE_FINDER_MOCK=1` returns realistic fake data with delays, so the UI can be built before the
backend is ready. Sample data in mock mode is obviously sample (example.com emails).

Gmail link: `https://mail.google.com/mail/?view=cm&fs=1&to=<email>&su=<subject>&body=<body>`
(URL-encoded). Copy uses `navigator.clipboard.writeText` with a visible "Copied" state.

## 7. Done means

- Backend: `cd fastapi-backend && .venv/bin/python -m pytest -q` passes; new endpoints appear in
  `app.openapi()`; a real preview for "dentists in Austin" returns 5 leads with honest whys; no
  secrets in logs or responses.
- Frontend: `cd client && npx vite build` and `npx oxlint src` show no new errors; the flow works
  end to end in the browser at 1440px and 390px in mock mode and against the real backend.
- A first-time user gets their first useful lead in under two minutes without reading anything.

## Testing account and service configuration

The optional testing login uses the same session and tools as a normal account.
Run `python scripts/configure-finder-test-login.py` from `fastapi-backend` to
configure an email and salted password hash in the ignored backend `.env`, then
restart the backend. On Sign in, choose **Sign in with a testing password**.
The configured account bypasses the daily batch quota; sign-in rate limits remain.
There is no default password or subscription gate in the application.

`POST /api/finder/sessions/password` accepts `{email, password}` and returns
`{account, token}`. It permits five attempts per source IP per 15 minutes.
Incorrect credentials return a generic 401. Blank configuration disables access.
For deployment, set `FINDER_TEST_EMAIL` and `FINDER_TEST_PASSWORD_HASH` separately
in the backend environment; the local `.env` is never deployed or committed.

Service access still depends on the configured providers:

- `MOTHERDUCK_TOKEN` and `MOTHERDUCK_DATABASE` provide the US dataset. US country
  aliases select its coverage; city/state terms still narrow the query.
- `LITELLM_BASE_URL` must point to a running gateway, with a valid
  `LITELLM_MASTER_KEY`. A localhost URL requires a local gateway process.
- Live searches need a valid `CORECLAW_API_KEY` and sufficient provider credits.
- Sign-in mail and weekly digests require `AGENTMAIL_API_KEY` and
  `FINDER_FROM_INBOX`, naming an existing AgentMail inbox.
- Social publishing requires connected destination accounts and their credentials.

A failed search provider must not be shown as a successful search with no matches.
When no usable leads remain after a provider failure, the preview reports `failed`.
A successful search with zero results reports `empty` and suggests broader wording.
