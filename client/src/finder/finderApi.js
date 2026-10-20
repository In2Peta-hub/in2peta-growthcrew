// Client for the lead finder (/api/finder). Contract: docs/lead-finder-spec.md §3.
//
// Mock mode (localStorage.gc_finder_mock = "1" or VITE_FINDER_MOCK=1) answers
// every call in memory with obviously-sample data, so screens can be built and
// demoed without the backend.

import { apiFetch, apiUrl } from '../api';

const SESSION_KEY = 'gc_finder_session';
const PENDING_KEY = 'gc_finder_pending_preview';

const isMock = () =>
  import.meta.env.VITE_FINDER_MOCK === '1' ||
  (typeof localStorage !== 'undefined' && localStorage.getItem('gc_finder_mock') === '1');

/* ── Session ─────────────────────────────────────────────────── */

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.email && parsed?.token ? parsed : null;
  } catch {
    return null;
  }
}

export function setSession(email, token) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email, token }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// The preview a visitor saw before signing up, so sign-up can attach it.
export function savePendingPreview(preview) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(preview));
}

export function takePendingPreview() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    localStorage.removeItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const authHeaders = () => {
  const session = getSession();
  return session ? { 'X-Finder-Token': session.token } : {};
};

const finder = (path, init = {}) =>
  apiFetch(`/api/finder${path}`, { ...init, headers: { ...authHeaders(), ...(init.headers || {}) } });

const json = (method, body) => ({ method, body: JSON.stringify(body ?? {}) });

/* ── Real client ─────────────────────────────────────────────── */

const real = {
  startPreview: (describe, website) => finder('/previews', json('POST', { describe, website: website || undefined })),
  getPreview: (previewId) => finder(`/previews/${encodeURIComponent(previewId)}`),
  createAccount: (email, previewId) => finder('/accounts', json('POST', { email, previewId })),
  requestSignIn: (email) => finder('/sessions', json('POST', { email })),
  verifySignIn: (email, code) => finder('/sessions/verify', json('POST', { email, code })),
  me: () => finder('/me'),
  setOffer: (offer) => finder('/me', json('PUT', { offer })),
  listLeads: (status = 'all') => finder(`/leads?status=${encodeURIComponent(status)}`),
  decide: (key, decision) => finder(`/leads/${encodeURIComponent(key)}/decision`, json('POST', { decision })),
  saveMessage: (key, subject, body) => finder(`/leads/${encodeURIComponent(key)}/message`, json('PUT', { subject, body })),
  startBatch: (count = 10, refine) => finder('/batches', json('POST', { count, refine })),
  getBatch: (batchId) => finder(`/batches/${encodeURIComponent(batchId)}`),
  setAutopilot: (enabled, count) => finder('/autopilot', json('PUT', { enabled, count })),
  // Header auth only (a ?token= link would land in server access logs), so the
  // file is fetched and handed to the browser as a blob.
  async downloadExport() {
    const response = await fetch(apiUrl('/api/finder/export.csv'), { headers: authHeaders() });
    if (!response.ok) throw new Error(`Download failed (${response.status})`);
    saveBlob(await response.blob());
  }
};

function saveBlob(blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'growthcrew-leads.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ── Mock client ─────────────────────────────────────────────── */

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SAMPLE = [
  { name: 'Priya Kulkarni', role: 'Owner', company: 'Smile Craft Dental', city: 'Pune', why: 'Runs her own clinic, so she decides what it buys.' },
  { name: null, role: null, company: 'Kothrud Family Dentistry', city: 'Pune', why: 'Family dental clinic in Kothrud with its own website.' },
  { name: 'Rahul Deshmukh', role: 'Founder', company: 'BrightBite Clinics', city: 'Pune', why: 'Founder of a three-branch clinic group.' },
  { name: 'Anita Rao', role: 'Practice manager', company: 'Aundh Dental Studio', city: 'Pune', why: 'Manages day-to-day running of a dental practice.' },
  { name: 'Vikram Shah', role: 'Principal dentist', company: 'Shah Dental Care', city: 'Pune', why: 'Principal dentist at an independent practice.' },
  { name: 'Meera Joshi', role: 'Co-founder', company: 'PearlSmile Dental', city: 'Pune', why: 'Co-founder of a dental clinic in Baner.' },
  { name: 'Sanjay Patil', role: 'Owner', company: 'Patil Orthodontics', city: 'Pune', why: 'Owns an orthodontics practice.' },
  { name: null, role: null, company: 'Viman Nagar Dental Clinic', city: 'Pune', why: 'Dental clinic in Viman Nagar with a listed email.' },
  { name: 'Kavita Nair', role: 'Director', company: 'Nair Dental Hospital', city: 'Pune', why: 'Director of a multi-chair dental hospital.' },
  { name: 'Arjun Mehta', role: 'Owner', company: 'Mehta Smile Centre', city: 'Pune', why: 'Owner of a smile clinic in Camp.' }
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const mockLead = (sample, batch, i) => ({
  key: `mock-${batch}-${i}-${slug(sample.company)}`,
  ...sample,
  website: `https://${slug(sample.company)}.example.com`,
  source: 'database',
  email: `${slug(sample.name || 'hello')}@${slug(sample.company)}.example.com`,
  phone: null,
  status: 'pending',
  message: null,
  batch,
  addedAt: new Date().toISOString()
});

const mockState = {
  previews: new Map(),
  batches: new Map(),
  leads: [],
  account: null,
  batchNo: 1
};

const understoodFrom = (describe) => {
  const m = describe.match(/^(.*)\s+(?:in|near|around)\s+(.+)$/i);
  return { who: (m ? m[1] : describe).trim(), where: m ? m[2].trim() : null, offer: null };
};

const mockAccount = () => ({
  ...mockState.account,
  counts: {
    pending: mockState.leads.filter((l) => l.status === 'pending').length,
    kept: mockState.leads.filter((l) => l.status === 'kept').length,
    skipped: mockState.leads.filter((l) => l.status === 'skipped').length
  }
});

const mock = {
  async startPreview(describe, website) {
    await wait(300);
    const previewId = `pv-${Date.now()}`;
    const empty = /nobody|zzz/i.test(describe);
    mockState.previews.set(previewId, { started: Date.now(), describe, website, empty });
    return { previewId, status: 'running' };
  },
  async getPreview(previewId) {
    await wait(250);
    const p = mockState.previews.get(previewId);
    if (!p) throw new Error('Preview not found');
    const understood = understoodFrom(p.describe);
    if (p.empty) {
      return { previewId, status: 'empty', understood, leads: [], suggestions: ['dentists in Maharashtra', 'dental clinics in Pune', 'clinics in Pune'] };
    }
    const elapsed = Date.now() - p.started;
    const shown = Math.min(5, Math.floor(elapsed / 700));
    const leads = SAMPLE.slice(0, shown).map((s, i) => {
      const { email: _email, phone: _phone, status: _status, message: _message, batch: _batch, addedAt: _addedAt, ...preview } = mockLead(s, 1, i);
      return preview;
    });
    return { previewId, status: shown >= 5 ? 'done' : 'running', understood, leads, suggestions: [] };
  },
  async createAccount(email, previewId) {
    await wait(400);
    const p = mockState.previews.get(previewId);
    mockState.account = {
      email,
      describe: p?.describe || 'dentists in Pune',
      website: p?.website || null,
      understood: understoodFrom(p?.describe || 'dentists in Pune'),
      autopilot: { enabled: false, count: 10, weekday: 'monday', nextRunAt: null },
      createdAt: new Date().toISOString()
    };
    mockState.leads = SAMPLE.slice(0, 5).map((s, i) => mockLead(s, 1, i));
    return { account: mockAccount(), token: 'mock-token' };
  },
  async requestSignIn() {
    await wait(400);
    return { sent: true };
  },
  async verifySignIn(email) {
    await wait(300);
    if (!mockState.account) await mock.createAccount(email);
    return { account: mockAccount(), token: 'mock-token' };
  },
  async me() {
    await wait(200);
    if (!mockState.account) await mock.createAccount(getSession()?.email || 'you@example.com');
    return { account: mockAccount() };
  },
  async setOffer(offer) {
    await wait(300);
    const text = /^(we|i|our|my)\b/i.test(offer) ? offer : `We offer ${offer}`;
    mockState.account.understood = { ...mockState.account.understood, offer: text };
    mockState.leads.forEach((l) => {
      if (l.message && !l.message.edited) l.message.body = l.message.body.replace(OFFER_PLACEHOLDER, `${text}.`);
    });
    return { account: mockAccount() };
  },
  async listLeads(status = 'all') {
    await wait(250);
    if (!mockState.account) await mock.me();
    const leads = status === 'all' ? mockState.leads : mockState.leads.filter((l) => l.status === status);
    return { leads: [...leads].sort((a, b) => b.batch - a.batch) };
  },
  async decide(key, decision) {
    await wait(decision === 'keep' ? 1200 : 150);
    const lead = mockState.leads.find((l) => l.key === key);
    if (!lead) throw new Error('Lead not found');
    lead.status = { keep: 'kept', skip: 'skipped', undo: 'pending' }[decision];
    if (decision === 'keep' && !lead.message) {
      const first = lead.name ? lead.name.split(' ')[0] : 'there';
      lead.message = {
        subject: `A quick question for ${lead.company}`,
        body: `Hi ${first},\n\nI came across ${lead.company} in ${lead.city}.\n\n${mockState.account?.understood?.offer ? `${mockState.account.understood.offer}.` : OFFER_PLACEHOLDER}\n\nWould a short call next week be useful? If it is not relevant, tell me and I will not follow up.\n\nBest,`,
        edited: false
      };
    }
    return { lead: { ...lead } };
  },
  async saveMessage(key, subject, body) {
    await wait(200);
    const lead = mockState.leads.find((l) => l.key === key);
    lead.message = { subject, body, edited: true };
    return { lead: { ...lead } };
  },
  async startBatch(count = 10) {
    await wait(300);
    const batchId = `b-${Date.now()}`;
    mockState.batchNo += 1;
    mockState.batches.set(batchId, { started: Date.now(), count, batch: mockState.batchNo });
    return { batchId };
  },
  async getBatch(batchId) {
    await wait(300);
    const b = mockState.batches.get(batchId);
    if (Date.now() - b.started < 1500) return { status: 'running', leads: [], suggestions: [] };
    if (!b.done) {
      const fresh = SAMPLE.slice(0, b.count).map((s, i) => mockLead({ ...s, company: `${s.company} ${b.batch}` }, b.batch, i));
      mockState.leads.push(...fresh);
      b.done = fresh;
    }
    return { status: 'done', leads: b.done, suggestions: [] };
  },
  async setAutopilot(enabled, count = 10) {
    await wait(300);
    const next = new Date();
    next.setUTCDate(next.getUTCDate() + ((8 - next.getUTCDay()) % 7 || 7));
    next.setUTCHours(8, 0, 0, 0);
    mockState.account.autopilot = { enabled, count, weekday: 'monday', nextRunAt: enabled ? next.toISOString() : null };
    return { account: mockAccount() };
  },
  async downloadExport() {
    const rows = mockState.leads.filter((l) => l.status === 'kept');
    const csv = ['name,role,company,email', ...rows.map((l) => [l.name, l.role, l.company, l.email].map((v) => `"${(v || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    saveBlob(new Blob([csv], { type: 'text/csv' }));
  }
};

/* ── Public surface ──────────────────────────────────────────── */

const pick = (name) => (...args) => (isMock() ? mock : real)[name](...args);

export const startPreview = pick('startPreview');
export const getPreview = pick('getPreview');
export const createAccount = pick('createAccount');
export const requestSignIn = pick('requestSignIn');
export const verifySignIn = pick('verifySignIn');
export const me = pick('me');
export const setOffer = pick('setOffer');
export const listLeads = pick('listLeads');
export const decide = pick('decide');
export const saveMessage = pick('saveMessage');
export const startBatch = pick('startBatch');
export const getBatch = pick('getBatch');
export const setAutopilot = pick('setAutopilot');
export const downloadExport = pick('downloadExport');

// Shown in a first message when we don't know what the user offers.
export const OFFER_PLACEHOLDER = '[One sentence on what you offer them]';

export const gmailComposeUrl = (to, subject, body) =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

// Poll a running preview/batch until it settles; calls onUpdate with every response.
export async function pollUntilSettled(fetchOnce, onUpdate, { intervalMs = 1500, timeoutMs = 70000, signal } = {}) {
  const started = Date.now();
  for (;;) {
    if (signal?.aborted) return null;
    const result = await fetchOnce();
    onUpdate?.(result);
    if (result.status !== 'running') return result;
    if (Date.now() - started > timeoutMs) return { ...result, status: result.leads?.length ? 'done' : 'failed', error: result.error || 'This is taking longer than usual.' };
    await wait(intervalMs);
  }
}
