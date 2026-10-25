# GrowthCrew

One React app and one FastAPI backend for two surfaces that share the same
shell, navigation and storage layer:

| Surface | What it does |
| --- | --- |
| **Social Studio** | AI captions, S3 media and multi-channel publishing (Instagram, Facebook, X, LinkedIn, …) |
| **Lead Gen & Outreach** | Lead search (MotherDuck dataset + live CoreClaw) and cold email (AgentMail) |

Switch surfaces from the header nav — both talk to the same API base, the same
error envelope, and the same persistence layer. There is no separate "app" per
feature.

## Stack

- **Frontend:** React + Vite + Tailwind (`client/`)
- **Backend:** FastAPI (`fastapi-backend/`) on port `3005` — the single API for both surfaces
- **Storage:** JSON files under `fastapi-backend/data/` through one shared data layer (`fastapi-backend/storage.py`) — no Postgres
- **Media:** AWS S3 uploads (optional; JSON fallback without credentials)
- **Publishing:** Meta Graph API directly; Postiz engine optional on `:4007`
- **AI:** In2Peta DeepSeek-Flash (`IN2PETA_*`), Gemini fallback
- **Outreach:** CoreClaw + AgentMail + MotherDuck lead database
- **Location autocomplete:** local India list plus OpenStreetMap Nominatim — no Google Places key

## Run locally

```bash
# Backend
cd fastapi-backend
pip install -r requirements.txt
cp .env.example .env   # fill keys as needed; never commit secrets
uvicorn main:app --port 3005 --reload

# Frontend (separate terminal)
cd client
bun install
bun run dev
```

- Public site: http://localhost:5173
- Dashboard: http://app.localhost:5173
- Lead Gen: http://app.localhost:5173/leads
- Social Studio: http://app.localhost:5173/social
- API docs: http://localhost:3005/docs

The Vite dev server proxies `/api/*` to the backend, so no `VITE_API_URL` is
needed locally. Set `VITE_API_URL=http://localhost:3005` in `client/.env` only
if you bypass the proxy.

The GrowthCrew logo in the dashboard returns to the public site. The Workspace
navigation tab returns to the dashboard home. Dashboard paths support direct
links, refresh, and browser Back and Forward. Signing in on a protected path
opens that section after authentication.

For a custom domain, serve the same frontend deployment on both `example.com`
and `app.example.com`. Set `VITE_SITE_URL=https://example.com` and
`VITE_APP_URL=https://app.example.com` at build time, and set the backend's
`FRONTEND_URL=https://example.com`. Add both domains and their DNS records in
your hosting provider. SPA fallback rewrites are already in `client/vercel.json`.
Vercel preview deployments use `/app`, `/app/leads`, and `/app/social` on the
preview host when these variables are absent.

Cross-host navigation requires the backend. It transfers sign-in using an
origin-bound code that expires after 60 seconds and works once. The code travels
in a URL fragment and is removed before the app renders. Session tokens stay in
API responses and browser storage. Local sample mode uses sample sessions.

After installing the backend dependencies above, run both services from one
terminal with the cross-platform launcher:

```bash
# Linux or macOS
python3 start-local.py
```

On Windows, run `py -3 start-local.py` or double-click `start-local.bat`.
Python and Bun must be installed, with Bun on `PATH`. The launcher uses
`fastapi-backend/.venv`, then the root `.venv`, or the active Python interpreter.
Install the backend dependencies into that environment.

The launcher installs frontend dependencies with the existing lockfile, starts
FastAPI on `:3005` and Vite on `:5173`, and stops both services on Ctrl+C or when
either exits. If a port is occupied, startup fails instead of choosing another
port. Use `--skip-install` to skip the frontend dependency install. Paths resolve
relative to the launcher, so it also works from another directory.

## Env

Copy keys from `fastapi-backend/.env.example` (placeholders only). Studio-only
use can leave the outreach keys blank, and vice versa.

| Area | Keys |
| --- | --- |
| Studio captions | `IN2PETA_*`, `GEMINI_API_KEY`, `GEMINI_MODEL` |
| Studio media | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET` |
| Studio publishing | `FB_PAGE_ID`, `FB_PAGE_ACCESS_TOKEN`, `POSTIZ_*` |
| Outreach email | `CORECLAW_API_KEY`, `AGENTMAIL_API_KEY`, `AGENTMAIL_WEBHOOK_SECRET`, `CENTRAL_INBOX` |
| Lead database | `MOTHERDUCK_TOKEN`, `MOTHERDUCK_DATABASE` |

## MotherDuck MCP and AI model

The lead finder keeps its describe → preview → keep/skip experience. Database
candidate searches for previews, refined batches, digests and manual outreach
now execute server-generated, bounded SQL through MotherDuck's hosted MCP
`query` tool at `https://api.motherduck.com/mcp`. USA country normalization,
SaaS/founder expansion, ranking and deduplication remain in the existing finder.
No separate MCP process is needed. Direct DuckDB is retained for database
health/size checks and diagnosing account failures, rather than lead retrieval.

Set `MOTHERDUCK_TOKEN`, `MOTHERDUCK_DATABASE`, `LITELLM_BASE_URL` and
`LITELLM_MASTER_KEY` in the backend environment. `LITELLM_MODEL` defaults to
`kimi-k3`; for gateway calls it takes precedence over an older model saved in
workspace settings. Provider fallback behavior remains available. The Render
blueprint and `.env.example` also select Kimi K3. Restart the API after changing
environment settings. Never put tokens in frontend environment variables.

`POST /api/growthcrew/leads/chat` is also available for conversational clients:
it accepts `message`, optional `previousFilters` and up to 12 `history` messages,
validates AI-generated filters, and returns normalized leads with executed SQL.
The PR's UI continues to use `/api/finder` and its existing request interpretation;
it does not perform a second AI interpretation through the chat endpoint.

## Layout

```
client/                      React app (Social Studio + Lead Gen UI, shared api.js)
fastapi-backend/             FastAPI: studio under /api, outreach under /api/growthcrew
fastapi-backend/storage.py   shared JSON data layer for both surfaces
fastapi-backend/data/        data.json (studio queue), outreach.json (leads/messages)
```

The legacy Express `server/` app has been retired — FastAPI is the only backend.

## Related guides

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) — Render (backend) + Vercel (frontend)
- [REACT_INTEGRATION_GUIDE.md](./REACT_INTEGRATION_GUIDE.md) — run or embed the React client
- [FASTAPI_INTEGRATION_GUIDE.md](./FASTAPI_INTEGRATION_GUIDE.md) — mount the FastAPI routers
