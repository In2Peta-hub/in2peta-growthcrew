# PostPulse Studio

React + FastAPI app for social publishing, with an optional **GrowthCrew** mode for email outreach.

## Product modes

Header toggle: **PostPulse** ↔ **GrowthCrew**

| Mode | Branding | UI |
| --- | --- | --- |
| **PostPulse** | PostPulse Studio | Studio (create) · Review & queue · Published |
| **GrowthCrew** | GrowthCrew Outreach | Lead search, draft/send email, replies |

The app is not renamed wholesale to Growthcrew. GrowthCrew is a second product mode.

## Stack

- **Frontend:** React + Vite + Tailwind (`client/`)
- **Backend:** FastAPI (`fastapi-backend/`) on port `3005`
- **Storage:** JSON files under `fastapi-backend/data/` (queue + outreach) — no Postgres
- **Media:** AWS S3 uploads (optional; falls back without credentials)
- **Publishing:** Postiz engine optional on `:4007`
- **Captions:** Gemini (via `GEMINI_API_KEY`)
- **Outreach:** CoreClaw + AgentMail + LLM keys (see `.env.example`)
- **Lead database:** MotherDuck (`business_leads`, ~10.6M USA business leads, optional `MOTHERDUCK_TOKEN`) — GrowthCrew searches merge database leads with live CoreClaw results
- **Location autocomplete:** local India city list; optional OpenStreetMap Nominatim — no Google Places key

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

- App: http://localhost:5173  
- API docs: http://localhost:3005/docs  

Set `VITE_API_URL=http://localhost:3005` in `client/.env` if the Vite proxy is not used.

**Windows:** `start-local.bat` starts FastAPI on `:3005` and the Vite client on `:5173`.

Prefer `cd client && bun run …` over root scripts that use `bun --cwd` (not reliable on all Bun builds).

## GrowthCrew env

Copy keys from `fastapi-backend/.env.example`. Outreach needs some of:

- `CORECLAW_API_KEY` — lead search  
- `AGENTMAIL_API_KEY` — sending inboxes / mail  
- `LITELLM_MASTER_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` — draft generation  

Studio-only use can leave outreach keys blank.

## Layout

```
client/                 React app (PostPulse + GrowthCrew UI)
fastapi-backend/        FastAPI (studio + /api/growthcrew/*)
fastapi-backend/data/   data.json (queue), outreach.json (leads/threads)
server/                 Legacy Express (optional; FastAPI is the primary API)
```

## Related guides

- [REACT_INTEGRATION_GUIDE.md](./REACT_INTEGRATION_GUIDE.md) — embed the React client  
- [FASTAPI_INTEGRATION_GUIDE.md](./FASTAPI_INTEGRATION_GUIDE.md) — mount the FastAPI routers  
