# FastAPI backend — GrowthCrew (Social Studio + Outreach)

One Python API for the social studio (`/api/*`) and lead-gen outreach (`/api/growthcrew/*`).

## Install & run

```bash
cd fastapi-backend
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --port 3005 --reload
```

Docs: http://localhost:3005/docs  

## Environment

See `fastapi-backend/.env.example` (placeholders only — never commit real secrets).

| Area | Keys |
| --- | --- |
| Captions | `GEMINI_API_KEY`, `GEMINI_MODEL` |
| Media | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET` |
| Publish (optional) | `POSTIZ_API_URL`, `POSTIZ_API_KEY` (engine often on `:4007`) |
| Outreach | `CORECLAW_API_KEY`, `AGENTMAIL_API_KEY`, `AGENTMAIL_WEBHOOK_SECRET`, `CENTRAL_INBOX`, `LITELLM_*` / `OPENAI_*` |
| Lead database (optional) | `MOTHERDUCK_TOKEN`, `MOTHERDUCK_DATABASE` |

Missing S3/Postiz → JSON fallback under `data/`. Missing outreach keys → studio still runs; GrowthCrew calls fail until configured.

## Storage

No Postgres. Both surfaces persist through the shared `storage.py` data layer
(`JsonStore`), which owns the locking and atomic writes. Files in
`fastapi-backend/data/`:

- `data.json` — studio queue / channels / settings
- `outreach.json` — GrowthCrew leads, threads, settings

## Mount routers

`main.py` already includes:

```python
from routers.studio_router import router as studio_router
from routers.growthcrew_router import router as growthcrew_router

app.include_router(studio_router)
app.include_router(growthcrew_router)
```

To embed in another FastAPI app, import those routers the same way (adjust package path as needed).

## Studio endpoints (summary)

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/health` | Health |
| `GET`/`POST` | `/api/channels` | Channels |
| `POST` | `/api/upload` | Media upload (S3 when configured) |
| `POST` | `/api/generate` | Caption generation |
| `GET` | `/api/queue` | Queue list |
| `POST` | `/api/queue/{id}/approve` | Approve |
| `POST` | `/api/queue/{id}/publish-now` | Publish |
| `PUT`/`DELETE` | `/api/queue/{id}` | Edit / remove |
| `GET`/`POST` | `/api/settings` | Auto-approve, etc. |

## GrowthCrew endpoints

All under `/api/growthcrew/` — settings, inboxes, lead search/upload, draft/send, threads, reply relay. See `/docs` for the live schema.

## Error shape

Every surface answers errors with the same envelope, so one client helper can
read either router:

```json
{ "error": "human message", "code": "MACHINE_CODE", "detail": "original detail" }
```

## Product naming

The single product is **GrowthCrew**, with two surfaces: **Social Studio**
(publishing) and **Lead Gen & Outreach**.
