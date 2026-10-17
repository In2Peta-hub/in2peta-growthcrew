# React client — GrowthCrew

Run or embed the Vite React app that hosts **Social Studio** and **Lead Gen &
Outreach** behind one shared shell and one API client.

## Dependencies

```bash
cd client
bun install
```

Main UI libs: React, Tailwind, `lucide-react`.

## Run standalone

```bash
cd client
bun install
bun run dev
```

Open http://localhost:5173

Point the client at FastAPI only if you are not using the Vite proxy:

```env
# client/.env
VITE_API_URL=http://localhost:3005
```

Without `VITE_API_URL`, `client/src/api.js` uses the dev proxy (relative `/api/*`)
and falls back to the deployed backend in production. Every surface calls the
backend through that one module, so there is a single base URL and error shape.

## Embed in another React app

Primary entry is `client/src/App.jsx`. Social Studio and the lead-gen
`OutreachPanel.jsx` render inside the same header, nav and login shell.

```jsx
import App from './App';

export function GrowthCrewPage() {
  return <App />;
}
```

Optional: `defaultTab="studio" | "queue" | "history" | "outreach"` — `"outreach"`
opens the Lead Gen surface.

## Product surfaces (UI)

- **Social Studio** — Create / Review & queue / Published
- **Lead Gen** — lead search and email outreach (`/api/growthcrew/*`)

Switch between them with the header nav.

## Build

```bash
cd client
bun run build
```
