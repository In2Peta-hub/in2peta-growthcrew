// Single API client for the whole app (social studio + lead-gen outreach).
//
// Every panel talks to the same backend through this module: one base URL and
// one error shape. Local dev uses the Vite proxy (same-origin ''); production
// falls back to the deployed backend so both surfaces stay in sync.

const envBase = import.meta.env.VITE_API_URL;
const fallbackBase = import.meta.env.DEV ? '' : 'https://in2peta-growthcrew-backend.onrender.com';

export const API_BASE = envBase ? envBase.replace(/\/$/, '') : fallbackBase;

export function apiUrl(path) {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${clean}`;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function readPayload(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

// Fetch JSON from the backend, normalising the unified {"error", "detail"} shape.
export async function apiFetch(path, init = {}) {
  const headers = new Headers(init.headers || {});
  const isForm = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (init.body && !isForm && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(apiUrl(path), { ...init, headers });
  const payload = await readPayload(response);
  if (!response.ok) {
    const raw = payload.error || payload.detail || `Request failed (${response.status})`;
    throw new ApiError(typeof raw === 'string' ? raw : 'Request failed', response.status);
  }
  return payload;
}

// Lead-gen / outreach namespace.
export const outreachApi = (path, init) => apiFetch(`/api/growthcrew${path}`, init);
