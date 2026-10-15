import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Mail,
  Search,
  Upload,
  Sparkles,
  Send,
  RefreshCw,
  Trash2,
  Check,
  XCircle,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import LocationAutocomplete from './LocationAutocomplete';

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';

const FIELD =
  'w-full bg-[#07080b] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#FF6B4A]/60 focus:ring-2 focus:ring-[#FF6B4A]/15 transition-all disabled:opacity-50';
const LABEL = 'text-xs font-bold text-slate-300 block';
const GHOST_BTN =
  'text-xs font-semibold text-slate-300 rounded-xl px-3.5 py-2 bg-white/[0.04] border border-white/10 inline-flex items-center justify-center gap-1.5 cursor-pointer hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFA84A]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all';
const PRIMARY_BTN =
  'scalora-btn-primary text-slate-950 text-xs font-bold rounded-xl px-4 py-2 inline-flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFA84A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1118] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg';
const CARD = 'scalora-card-glow rounded-3xl p-6 shadow-2xl space-y-5';
const CARD_HEADER = 'flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5';

const STATUS_META = {
  NEW: { label: 'New', tone: 'border-slate-500/30 bg-slate-500/10 text-slate-300' },
  SAVED: { label: 'Saved', tone: 'border-sky-500/30 bg-sky-500/10 text-sky-300' },
  SENT: { label: 'Sent', tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
  REPLIED: { label: 'Replied', tone: 'border-[#FFA84A]/35 bg-[#FFA84A]/10 text-[#FFA84A]' },
  FAILED: { label: 'Failed', tone: 'border-rose-500/30 bg-rose-500/10 text-rose-300' },
  DRAFT: { label: 'Draft', tone: 'border-violet-500/30 bg-violet-500/10 text-violet-300' },
  PENDING_REPLY: { label: 'Awaiting reply', tone: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
};

async function outreach(path, init = {}) {
  const headers = new Headers(init.headers || {});
  const isForm = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (init.body && !isForm && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(`${API_BASE}/api/growthcrew${path}`, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }
  return payload;
}

function inboxOptions(payload) {
  const list = payload?.inboxes || payload?.data || payload;
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => ({
      id: item.inbox_id || item.inboxId || item.id || '',
      label: item.email || item.display_name || item.displayName || item.inbox_id || item.id,
    }))
    .filter((item) => item.id);
}

function statusMeta(status) {
  const key = String(status || 'NEW')
    .trim()
    .toUpperCase()
    .replace(/[-\s]+/g, '_');
  if (STATUS_META[key]) return STATUS_META[key];
  const label = String(status || 'New')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
  return { label, tone: STATUS_META.NEW.tone };
}

function friendlyError(error) {
  const raw = String(error?.message || error || 'Something went wrong');
  return raw
    .replace(/\bCoreClaw\b/gi, 'Lead search')
    .replace(/\bAgentMail\b/gi, 'Email')
    .replace(/\bgateway\b/gi, 'AI service')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatWhen(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function StatusChip({ status }) {
  const meta = statusMeta(status);
  return (
    <span className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${meta.tone}`}>
      {meta.label}
    </span>
  );
}

function NoticeBanner({ notice, onDismiss }) {
  if (!notice?.text) return null;
  const isError = notice.tone === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`mt-4 flex items-start gap-3 rounded-xl border px-3 py-2.5 text-xs ${
        isError
          ? 'border-rose-500/25 bg-rose-500/10 text-rose-200'
          : notice.tone === 'success'
            ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
            : 'border-white/10 bg-white/[0.04] text-slate-300'
      }`}
    >
      {isError && <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      <p className="min-w-0 flex-1 leading-relaxed">{notice.text}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-lg p-1 text-current/70 hover:bg-white/10 hover:text-current focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFA84A]/40 cursor-pointer"
        aria-label="Dismiss notice"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ConfirmDialog({ open, title, body, confirmLabel, danger, busy, onCancel, onConfirm }) {
  const titleId = useId();
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    cancelRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="presentation" onClick={() => !busy && onCancel()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#10141c] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id={titleId} className="text-base font-extrabold text-white tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button ref={cancelRef} type="button" disabled={busy} onClick={onCancel} className={GHOST_BTN}>
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={
              danger
                ? 'rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-50 cursor-pointer'
                : PRIMARY_BTN
            }
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function InboxCreateDialog({ open, busy, onCancel, onCreate }) {
  const titleId = useId();
  const inputRef = useRef(null);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    setDisplayName('');
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    const onKey = (event) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="presentation" onClick={() => !busy && onCancel()}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#10141c] p-6 shadow-2xl space-y-4"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = displayName.trim();
          if (!trimmed || busy) return;
          onCreate(trimmed);
        }}
      >
        <div>
          <h3 id={titleId} className="text-base font-extrabold text-white tracking-tight">New sending inbox</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Name the address emails send from. Replies still go to your central inbox.
          </p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="outreach-inbox-name" className={LABEL}>Display name</label>
          <input
            id="outreach-inbox-name"
            ref={inputRef}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="e.g. Outreach — Bengaluru"
            disabled={busy}
            className={FIELD}
            required
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" disabled={busy} onClick={onCancel} className={GHOST_BTN}>
            Cancel
          </button>
          <button type="submit" disabled={busy || !displayName.trim()} className={PRIMARY_BTN}>
            {busy ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…
              </>
            ) : (
              'Create inbox'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-[#090b10]/40 px-4 py-8 text-center text-xs leading-relaxed text-slate-500 min-h-[7.5rem] flex items-center justify-center">
      {children}
    </div>
  );
}

function LoadingRows({ label }) {
  return (
    <div className="space-y-2 min-h-[7.5rem]" aria-live="polite" aria-busy="true">
      {[0, 1, 2].map((row) => (
        <div key={row} className="animate-pulse rounded-2xl border border-white/[0.06] bg-[#090b10]/60 px-3 py-3">
          <div className="mb-2 h-3 w-2/5 rounded bg-white/10" />
          <div className="h-2.5 w-3/5 rounded bg-white/[0.06]" />
        </div>
      ))}
      <p className="flex items-center justify-center gap-2 pt-1 text-[11px] text-slate-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FFA84A]" /> {label}
      </p>
    </div>
  );
}

function StepBadge({ n, tone = 'emerald' }) {
  const tones = {
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    violet: 'bg-[#A855F7]/20 text-[#C4B5FD] border-[#A855F7]/30',
    amber: 'bg-[#FF6B4A]/20 text-[#FFA84A] border-[#FF6B4A]/30',
  };
  return (
    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-extrabold text-xs border ${tones[tone]}`}>
      {n}
    </span>
  );
}

export default function OutreachPanel() {
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState('');
  const [bootError, setBootError] = useState('');
  const [booting, setBooting] = useState(true);
  const [settings, setSettings] = useState(null);
  const [inboxes, setInboxes] = useState([]);
  const [inboxLoadError, setInboxLoadError] = useState('');
  const [inboxId, setInboxId] = useState('');
  const [query, setQuery] = useState('AI startups and software companies');
  const [location, setLocation] = useState('');
  const [maxResults, setMaxResults] = useState(10);
  const [found, setFound] = useState([]);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [selected, setSelected] = useState({});
  const [drafts, setDrafts] = useState([]);
  const [activeDraft, setActiveDraft] = useState(0);
  const [leads, setLeads] = useState([]);
  const [thread, setThread] = useState(null);
  const [threadError, setThreadError] = useState('');
  const [reply, setReply] = useState({ subject: '', body: '' });
  const [showInboxDialog, setShowInboxDialog] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const noticeTimer = useRef(null);

  const chosen = useMemo(
    () => found.filter((lead) => selected[lead.email]),
    [found, selected],
  );
  const selectedCount = chosen.length;
  const allSelected = found.length > 0 && selectedCount === found.length;
  const draft = drafts[activeDraft] || null;
  const reviewFirst = (settings?.sending?.mode || 'manual') !== 'auto';
  const isBusy = Boolean(busy);
  const canDraft = selectedCount > 0 && Boolean(inboxId) && !isBusy;

  const clearNotice = () => {
    if (noticeTimer.current) {
      window.clearTimeout(noticeTimer.current);
      noticeTimer.current = null;
    }
    setNotice(null);
  };

  const say = (text, tone = 'info') => {
    if (noticeTimer.current) {
      window.clearTimeout(noticeTimer.current);
      noticeTimer.current = null;
    }
    setNotice({ text, tone });
    if (tone !== 'error') {
      noticeTimer.current = window.setTimeout(() => {
        setNotice(null);
        noticeTimer.current = null;
      }, 4200);
    }
  };

  const fail = (error) => say(friendlyError(error), 'error');

  useEffect(() => () => {
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
  }, []);

  async function loadWorkspace() {
    const [nextSettings, nextLeads] = await Promise.all([
      outreach('/settings'),
      outreach('/leads'),
    ]);
    setSettings(nextSettings);
    setLeads(nextLeads.leads || []);
    try {
      const inboxPayload = await outreach('/inboxes');
      const options = inboxOptions(inboxPayload);
      setInboxes(options);
      setInboxLoadError('');
      setInboxId((current) => current || options[0]?.id || '');
    } catch (error) {
      setInboxes([]);
      setInboxLoadError(friendlyError(error));
    }
  }

  useEffect(() => {
    setBooting(true);
    loadWorkspace()
      .catch((error) => setBootError(friendlyError(error)))
      .finally(() => setBooting(false));
  }, []);

  async function saveSendingMode(mode) {
    if (isBusy) return;
    clearNotice();
    setBusy('mode');
    try {
      const next = await outreach('/settings', {
        method: 'PUT',
        body: JSON.stringify({ sending: { mode } }),
      });
      setSettings(next);
      say(mode === 'auto' ? 'Emails will send right after drafting.' : 'Emails will wait for your review.', 'success');
    } catch (error) {
      fail(error);
    } finally {
      setBusy('');
    }
  }

  async function saveCentralInbox(centralInbox) {
    clearNotice();
    const next = await outreach('/settings', {
      method: 'PUT',
      body: JSON.stringify({ email: { centralInbox } }),
    });
    setSettings(next);
    say('Reply inbox saved.', 'success');
  }

  async function runSearch(event) {
    event.preventDefault();
    clearNotice();
    setBusy('search');
    setSearchAttempted(true);
    try {
      const started = await outreach('/leads/search/start', {
        method: 'POST',
        body: JSON.stringify({ query, location, maxResults: Number(maxResults) }),
      });
      for (let attempt = 0; attempt < 150; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const status = await outreach(`/leads/search/${encodeURIComponent(started.runSlug)}`);
        if (status.status === 'running') continue;
        if (status.status === 'failed') throw new Error(status.error || 'Lead search failed');
        setFound(status.leads || []);
        setSelected(Object.fromEntries((status.leads || []).map((lead) => [lead.email, true])));
        const count = status.count || (status.leads || []).length;
        const fromDb = status.sources?.database || 0;
        const fromLive = status.sources?.live || 0;
        const breakdown = fromDb && fromLive ? ` (${fromDb} from your lead database, ${fromLive} live)` : '';
        if (count) say(`${count} lead${count === 1 ? '' : 's'} ready to draft${breakdown}.`, 'success');
        else say('No emails found. Try a broader search or upload a CSV.', 'info');
        return;
      }
      throw new Error('Search is taking too long. Try fewer leads.');
    } catch (error) {
      fail(error);
    } finally {
      setBusy('');
    }
  }

  async function uploadCsv(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || isBusy) return;
    clearNotice();
    setBusy('upload');
    setSearchAttempted(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const result = await outreach('/leads/upload', { method: 'POST', body });
      setFound(result.leads || []);
      setSelected(Object.fromEntries((result.leads || []).map((lead) => [lead.email, true])));
      const count = result.count || (result.leads || []).length;
      if (count) say(`${count} lead${count === 1 ? '' : 's'} loaded from CSV.`, 'success');
      else say('CSV had no usable email rows.', 'info');
    } catch (error) {
      fail(error);
    } finally {
      setBusy('');
    }
  }

  async function createInbox(displayName) {
    clearNotice();
    setBusy('inbox');
    try {
      const created = await outreach('/inboxes', {
        method: 'POST',
        body: JSON.stringify({ displayName }),
      });
      await loadWorkspace();
      const id = created.inbox_id || created.inboxId || created.id;
      if (id) setInboxId(id);
      setShowInboxDialog(false);
      say('Sending inbox created.', 'success');
    } catch (error) {
      fail(error);
    } finally {
      setBusy('');
    }
  }

  async function writeDrafts() {
    if (!chosen.length) {
      say('Select at least one lead.', 'error');
      return;
    }
    if (!inboxId) {
      say('Choose a sending inbox first.', 'error');
      return;
    }
    clearNotice();
    setBusy('draft');
    try {
      const payload = {
        leads: chosen,
        senderInboxIds: [inboxId],
        icp: '',
        productContext: settings?.brand?.offer || '',
        senderName: settings?.email?.senderName || undefined,
      };
      if (!reviewFirst) {
        const sent = await outreach('/campaign/send', { method: 'POST', body: JSON.stringify(payload) });
        setDrafts([]);
        const sentCount = sent.sent || 0;
        const failedCount = sent.failed || 0;
        if (failedCount) say(`Sent ${sentCount}, ${failedCount} failed.`, 'error');
        else say(`Sent ${sentCount} email${sentCount === 1 ? '' : 's'}.`, 'success');
        await loadWorkspace();
        return;
      }
      const drafted = await outreach('/campaigns/draft', { method: 'POST', body: JSON.stringify(payload) });
      const ready = (drafted.results || []).filter(Boolean);
      setDrafts(ready);
      setActiveDraft(0);
      const draftCount = ready.filter((item) => item.status === 'draft').length;
      say(`${draftCount} draft${draftCount === 1 ? '' : 's'} ready to review.`, 'success');
      await loadWorkspace();
    } catch (error) {
      fail(error);
    } finally {
      setBusy('');
    }
  }

  function updateDraft(patch) {
    setDrafts((current) => current.map((item, index) => (index === activeDraft ? { ...item, ...patch } : item)));
  }

  async function approveDraft() {
    if (!draft || draft.status !== 'draft') return;
    clearNotice();
    setBusy('send');
    try {
      const result = await outreach('/campaigns/send-approved', {
        method: 'POST',
        body: JSON.stringify({ drafts: [draft] }),
      });
      const outcome = result.results?.[0];
      if (outcome?.status !== 'sent') throw new Error(outcome?.error || 'Send failed');
      const nextLen = drafts.length - 1;
      setDrafts((current) => current.filter((_, index) => index !== activeDraft));
      setActiveDraft((index) => Math.min(index, Math.max(0, nextLen - 1)));
      setConfirm(null);
      say(`Sent to ${draft.email}.`, 'success');
      await loadWorkspace();
    } catch (error) {
      fail(error);
    } finally {
      setBusy('');
    }
  }

  function discardDraft() {
    const nextLen = drafts.length - 1;
    setDrafts((current) => current.filter((_, index) => index !== activeDraft));
    setActiveDraft((index) => Math.min(index, Math.max(0, nextLen - 1)));
    setConfirm(null);
    say('Draft discarded.', 'info');
  }

  function addManualLead(event) {
    event?.preventDefault?.();
    if (isBusy) return;
    const email = manualEmail.trim();
    const name = manualName.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      say('Enter a valid email address to add a lead.', 'error');
      return;
    }
    const normalized = email.toLowerCase();
    if (drafts.some((item) => String(item.email || '').trim().toLowerCase() === normalized)) {
      say(`${email} is already in review.`, 'error');
      return;
    }
    if (!inboxId) {
      say('Choose a sending inbox first, then add the lead.', 'error');
      return;
    }
    const entry = {
      email,
      name: name || email.split('@')[0],
      company: name || '',
      subject: '',
      body: '',
      status: 'draft',
      senderInboxId: inboxId,
      manual: true,
    };
    setDrafts((current) => {
      const next = [...current, entry];
      setActiveDraft(next.length - 1);
      return next;
    });
    setManualEmail('');
    setManualName('');
    say(`Added ${email} to review. Write the subject and body, then approve.`, 'success');
  }

  async function openThread(lead) {
    if (busy === 'thread') return;
    clearNotice();
    setBusy('thread');
    setThreadError('');
    try {
      const next = await outreach(`/leads/${lead.id}/thread`);
      setThread(next);
      setReply({ subject: lead.lastSubject ? `Re: ${lead.lastSubject}` : '', body: '' });
    } catch (error) {
      setThread(null);
      setThreadError(friendlyError(error));
      fail(error);
    } finally {
      setBusy('');
    }
  }

  async function draftReply() {
    if (!thread?.lead) return;
    clearNotice();
    setBusy('reply');
    try {
      const next = await outreach(`/leads/${thread.lead.id}/draft-reply`, { method: 'POST' });
      setReply(next);
      say('Reply drafted — edit before sending.', 'success');
    } catch (error) {
      fail(error);
    } finally {
      setBusy('');
    }
  }

  async function sendReply() {
    if (!thread?.lead || !inboxId || !reply.subject || !reply.body) {
      say('Add a subject and body to reply.', 'error');
      return;
    }
    clearNotice();
    setBusy('reply-send');
    try {
      await outreach(`/leads/${thread.lead.id}/send`, {
        method: 'POST',
        body: JSON.stringify({ inboxId, subject: reply.subject, body: reply.body }),
      });
      say(`Reply sent to ${thread.lead.email}.`, 'success');
      await openThread(thread.lead);
      await loadWorkspace();
    } catch (error) {
      fail(error);
    } finally {
      setBusy('');
    }
  }

  async function removeLead(lead) {
    clearNotice();
    setBusy('delete');
    try {
      await outreach(`/leads/${lead.id}`, { method: 'DELETE' });
      if (thread?.lead?.id === lead.id) {
        setThread(null);
        setThreadError('');
      }
      setConfirm(null);
      say('Lead removed.', 'success');
      await loadWorkspace();
    } catch (error) {
      fail(error);
    } finally {
      setBusy('');
    }
  }

  async function pullReplies() {
    if (!inboxId) {
      say('Choose a sending inbox first.', 'error');
      return;
    }
    clearNotice();
    setBusy('relay');
    try {
      const result = await outreach('/replies/relay', {
        method: 'POST',
        body: JSON.stringify({ inboxIds: [inboxId] }),
      });
      const count = result.count || 0;
      say(count ? `Pulled ${count} new repl${count === 1 ? 'y' : 'ies'}.` : 'No new replies.', 'success');
      await loadWorkspace();
    } catch (error) {
      fail(error);
    } finally {
      setBusy('');
    }
  }

  function selectAllLeads() {
    setSelected(Object.fromEntries(found.map((lead) => [lead.email, true])));
  }

  function clearSelection() {
    setSelected({});
  }

  function toggleLead(email) {
    setSelected((current) => ({ ...current, [email]: !current[email] }));
  }

  const draftLabel = reviewFirst
    ? selectedCount
      ? `Draft ${selectedCount} email${selectedCount === 1 ? '' : 's'}`
      : 'Draft emails'
    : selectedCount
      ? `Send ${selectedCount} email${selectedCount === 1 ? '' : 's'}`
      : 'Send emails';

  return (
    <div className="space-y-6">
      <div className={CARD}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              Find leads <span className="font-serif-accent italic font-normal text-[#FFA84A]">& send</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Search, draft, and manage replies.</p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="text-right leading-tight">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block">Sending mode</span>
              <span className={`text-[11px] font-extrabold ${reviewFirst ? 'text-[#FFA84A]' : 'text-emerald-400'}`}>
                {reviewFirst ? 'Review first' : 'Send immediately'}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!reviewFirst}
              aria-label={reviewFirst ? 'Review first. Switch to send immediately.' : 'Send immediately. Switch to review first.'}
              disabled={busy === 'mode' || booting}
              onClick={() => saveSendingMode(reviewFirst ? 'auto' : 'manual')}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFA84A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1118] disabled:opacity-50 disabled:cursor-not-allowed ${
                reviewFirst ? 'bg-slate-800 border border-white/10' : 'bg-emerald-500'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition ${
                  reviewFirst ? 'translate-x-0' : 'translate-x-5'
                }`}
              />
            </button>
          </div>
        </div>
        <NoticeBanner notice={notice} onDismiss={clearNotice} />
        {booting && (
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FFA84A]" /> Loading…
          </p>
        )}
        {bootError && !booting && (
          <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200" role="alert">
            Couldn’t load Outreach. {bootError}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-7 space-y-6">
          <form onSubmit={runSearch} className={CARD}>
            <div className={CARD_HEADER}>
              <div className="flex items-center gap-2.5 min-w-0">
                <StepBadge n={1} tone="emerald" />
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-white tracking-tight">Find leads</h3>
                  <p className="text-[11px] text-slate-400">Your lead database + live web search, or upload a CSV</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="outreach-query" className={LABEL}>Who are you looking for?</label>
              <input
                id="outreach-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                disabled={busy === 'search'}
                className={FIELD}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="outreach-location" className={LABEL}>Location</label>
                <LocationAutocomplete
                  id="outreach-location"
                  value={location}
                  onChange={setLocation}
                  disabled={busy === 'search'}
                  className={FIELD}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="outreach-count" className={LABEL}>Count</label>
                <input
                  id="outreach-count"
                  type="number"
                  min="1"
                  max="100"
                  value={maxResults}
                  onChange={(event) => setMaxResults(event.target.value)}
                  disabled={busy === 'search'}
                  className={FIELD}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={isBusy} className={PRIMARY_BTN}>
                {busy === 'search' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" /> Search leads
                  </>
                )}
              </button>
              <label
                className={`${GHOST_BTN} ${isBusy ? 'opacity-50 pointer-events-none' : ''}`}
                aria-disabled={isBusy}
              >
                {busy === 'upload' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" /> Upload CSV
                  </>
                )}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  disabled={isBusy}
                  onChange={uploadCsv}
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-4">
              <p className="text-[11px] text-slate-400">
                {found.length === 0 ? 'No leads yet' : `${selectedCount} of ${found.length} selected`}
              </p>
              {found.length > 0 && (
                <button
                  type="button"
                  onClick={allSelected ? clearSelection : selectAllLeads}
                  className={GHOST_BTN}
                  disabled={isBusy}
                >
                  {allSelected ? 'Clear' : 'Select all'}
                </button>
              )}
            </div>

            <div className="max-h-64 overflow-auto space-y-2">
              {busy === 'search' || busy === 'upload' ? (
                <LoadingRows label={busy === 'upload' ? 'Reading CSV…' : 'Searching…'} />
              ) : found.length === 0 ? (
                <EmptyState>
                  {searchAttempted ? 'No leads found. Adjust the search or upload a CSV.' : 'Search or upload a CSV to get started.'}
                </EmptyState>
              ) : (
                found.map((lead) => {
                  const checked = Boolean(selected[lead.email]);
                  return (
                    <label
                      key={lead.email}
                      className={`flex items-start gap-3 rounded-2xl border px-3 py-2.5 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-[#FFA84A]/30 ${
                        checked
                          ? 'border-[#FFA84A]/30 bg-[#FFA84A]/[0.06]'
                          : 'border-white/[0.06] bg-[#090b10]/60 hover:border-white/15'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleLead(lead.email)}
                        className="mt-1 h-3.5 w-3.5 rounded border-white/20 bg-black/40 text-[#FFA84A] focus:ring-[#FFA84A]/40"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-white truncate">{lead.company || lead.name || 'Lead'}</span>
                        <span className="block text-[11px] text-slate-400 truncate">
                          {lead.email}
                          {lead.city ? ` · ${lead.city}` : ''}
                          {lead.source === 'lead-database' ? ' · DB' : lead.source === 'live-search' ? ' · Live' : ''}
                        </span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </form>

          <div className={CARD}>
            <div className={CARD_HEADER}>
              <div className="flex items-center gap-2.5 min-w-0">
                <StepBadge n={2} tone="violet" />
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-white tracking-tight">Sending inbox</h3>
                  <p className="text-[11px] text-slate-400">Where emails send from</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInboxDialog(true)}
                disabled={isBusy}
                className="text-xs font-semibold text-[#FFA84A] hover:text-[#ffb96a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFA84A]/40 rounded-lg px-2 py-1 cursor-pointer disabled:opacity-50 shrink-0"
              >
                New inbox
              </button>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="outreach-from-inbox" className={LABEL}>From inbox</label>
              <select
                id="outreach-from-inbox"
                value={inboxId}
                onChange={(event) => setInboxId(event.target.value)}
                disabled={isBusy}
                className={FIELD}
              >
                <option value="">Select an inbox</option>
                {inboxes.map((inbox) => (
                  <option key={inbox.id} value={inbox.id}>{inbox.label}</option>
                ))}
              </select>
            </div>

            {inboxLoadError && (
              <p className="text-xs text-rose-300" role="alert">{inboxLoadError}</p>
            )}
            {!inboxLoadError && !booting && inboxes.length === 0 && (
              <EmptyState>No inboxes yet — create one to continue.</EmptyState>
            )}

            <div className="space-y-1.5">
              <label htmlFor="outreach-central-inbox" className={LABEL}>Central reply inbox</label>
              <input
                id="outreach-central-inbox"
                defaultValue={settings?.email?.centralInbox || ''}
                key={settings?.email?.centralInbox || 'inbox'}
                disabled={isBusy}
                onBlur={(event) => {
                  if (event.target.value && event.target.value !== settings?.email?.centralInbox) {
                    saveCentralInbox(event.target.value).catch((error) => fail(error));
                  }
                }}
                className={FIELD}
                placeholder="you@company.com"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!reviewFirst) {
                  setConfirm({
                    title: `Send ${selectedCount} email${selectedCount === 1 ? '' : 's'} now?`,
                    body: 'Send-immediately mode is on. These emails will go out without a review step.',
                    confirmLabel: `Send ${selectedCount}`,
                    danger: false,
                    onConfirm: () => {
                      setConfirm(null);
                      writeDrafts();
                    },
                  });
                  return;
                }
                writeDrafts();
              }}
              disabled={!canDraft}
              className={PRIMARY_BTN}
              title={!inboxId ? 'Choose a sending inbox first' : selectedCount === 0 ? 'Select at least one lead' : undefined}
            >
              {busy === 'draft' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Working…
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> {draftLabel}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="xl:col-span-5 space-y-6">
          <div className={CARD}>
            <div className={CARD_HEADER}>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#FFA84A]" aria-hidden="true" />
                <h3 className="text-sm font-extrabold text-white tracking-tight">Email review</h3>
              </div>
              {drafts.length > 0 && (
                <span className="text-[10px] font-bold tabular-nums text-slate-400">
                  {Math.min(activeDraft + 1, drafts.length)} of {drafts.length}
                </span>
              )}
            </div>

            <form onSubmit={addManualLead} className="rounded-2xl border border-white/[0.06] bg-[#090b10]/60 px-3 py-3 space-y-2.5">
              <p className="text-[11px] font-bold text-slate-300">Add lead manually</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(event) => setManualEmail(event.target.value)}
                  placeholder="name@company.com"
                  disabled={isBusy}
                  aria-label="Manual lead email"
                  className={FIELD}
                />
                <input
                  type="text"
                  value={manualName}
                  onChange={(event) => setManualName(event.target.value)}
                  placeholder="Name or company (optional)"
                  disabled={isBusy}
                  aria-label="Manual lead name or company"
                  className={FIELD}
                />
              </div>
              <button type="submit" disabled={isBusy || !manualEmail.trim()} className={GHOST_BTN} title={!inboxId ? 'Choose a sending inbox first' : 'Add this email to review'}>
                <Plus className="w-3.5 h-3.5" /> Add to review
              </button>
              {!inboxId && (
                <p className="text-[11px] text-slate-500">Choose a sending inbox below to enable manual entry.</p>
              )}
            </form>

            {busy === 'draft' ? (
              <LoadingRows label="Writing drafts…" />
            ) : !draft ? (
              <EmptyState>Drafts appear here for review before sending.</EmptyState>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{draft.company || draft.name || 'Lead'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{draft.email}</p>
                  </div>
                  {draft.status === 'failed' && <StatusChip status="FAILED" />}
                </div>

                {draft.status === 'failed' ? (
                  <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-200" role="alert">
                    {friendlyError(draft.error || 'This draft failed.')}
                  </p>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label htmlFor="outreach-draft-subject" className={LABEL}>Subject</label>
                      <input
                        id="outreach-draft-subject"
                        value={draft.subject || ''}
                        onChange={(event) => updateDraft({ subject: event.target.value })}
                        disabled={busy === 'send'}
                        className={`${FIELD} font-semibold`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="outreach-draft-body" className={LABEL}>Body</label>
                      <textarea
                        id="outreach-draft-body"
                        value={draft.body || ''}
                        onChange={(event) => updateDraft({ body: event.target.value })}
                        rows={12}
                        disabled={busy === 'send'}
                        className={`${FIELD} leading-relaxed resize-y min-h-[220px]`}
                      />
                    </div>
                  </>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setConfirm({
                        title: `Send to ${draft.email}?`,
                        body: 'This can’t be undone. Double-check the subject and body first.',
                        confirmLabel: 'Approve & send',
                        danger: false,
                        onConfirm: approveDraft,
                      })
                    }
                    disabled={draft.status !== 'draft' || isBusy || !draft.subject?.trim() || !draft.body?.trim()}
                    className={PRIMARY_BTN}
                    title={draft.status === 'draft' && (!draft.subject?.trim() || !draft.body?.trim()) ? 'Add a subject and body before sending' : undefined}
                  >
                    {busy === 'send' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" /> Approve & send
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirm({
                        title: 'Discard this draft?',
                        body: `Remove the draft for ${draft.email} from review.`,
                        confirmLabel: 'Discard',
                        danger: true,
                        onConfirm: discardDraft,
                      })
                    }
                    disabled={isBusy}
                    className={GHOST_BTN}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Discard
                  </button>
                </div>

                {drafts.length > 1 && (
                  <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveDraft((index) => Math.max(0, index - 1))}
                      disabled={activeDraft === 0 || isBusy}
                      className={GHOST_BTN}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveDraft((index) => Math.min(drafts.length - 1, index + 1))}
                      disabled={activeDraft >= drafts.length - 1 || isBusy}
                      className={GHOST_BTN}
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
        <div className="xl:col-span-5">
          <div className={`${CARD} h-full`}>
            <div className={CARD_HEADER}>
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <h3 className="text-sm font-extrabold text-white tracking-tight">Sent & replies</h3>
              </div>
              <button
                type="button"
                onClick={pullReplies}
                disabled={!inboxId || isBusy}
                className={GHOST_BTN}
              >
                {busy === 'relay' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Pull replies
              </button>
            </div>

            <div className="max-h-[28rem] overflow-auto space-y-2">
              {booting ? (
                <LoadingRows label="Loading leads…" />
              ) : leads.length === 0 ? (
                <EmptyState>Leads show up here after you draft or send.</EmptyState>
              ) : (
                leads.map((lead) => {
                  const active = thread?.lead?.id === lead.id;
                  return (
                    <div
                      key={lead.id}
                      className={`rounded-2xl border px-3 py-2.5 flex items-center justify-between gap-2 transition-colors ${
                        active
                          ? 'border-[#FFA84A]/35 bg-[#FFA84A]/[0.07]'
                          : 'border-white/[0.06] bg-[#090b10]/60'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => openThread(lead)}
                        disabled={busy === 'thread'}
                        className="text-left min-w-0 flex-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFA84A]/40 rounded-lg disabled:opacity-60"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="block text-sm font-semibold text-white truncate">{lead.company || lead.name || lead.email}</span>
                          <StatusChip status={lead.status} />
                        </span>
                        <span className="block text-[11px] text-slate-400 truncate mt-0.5">
                          {lead.email}
                          {lead.replyCount > 0 ? ` · ${lead.replyCount} repl${lead.replyCount === 1 ? 'y' : 'ies'}` : ''}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirm({
                            title: `Delete ${lead.email}?`,
                            body: 'This removes the lead and its message history.',
                            confirmLabel: 'Delete',
                            danger: true,
                            onConfirm: () => removeLead(lead),
                          })
                        }
                        disabled={isBusy}
                        className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 cursor-pointer disabled:opacity-50"
                        aria-label={`Delete ${lead.email}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-7">
          <div className={`${CARD} min-h-[28rem] h-full flex flex-col`}>
            <div className={CARD_HEADER}>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-white tracking-tight">Conversation</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {thread?.lead
                    ? (thread.lead.company || thread.lead.name || thread.lead.email)
                    : 'Select a lead to open the thread'}
                </p>
              </div>
              {thread?.lead && <StatusChip status={thread.lead.status} />}
            </div>

            {busy === 'thread' ? (
              <LoadingRows label="Loading conversation…" />
            ) : threadError ? (
              <EmptyState>{threadError}</EmptyState>
            ) : !thread ? (
              <EmptyState>Open a lead to view the thread and reply.</EmptyState>
            ) : (
              <>
                <div className="flex-1 max-h-72 overflow-auto space-y-2.5">
                  {(thread.messages || []).length === 0 ? (
                    <EmptyState>No messages yet.</EmptyState>
                  ) : (
                    (thread.messages || []).map((message) => {
                      const inbound = String(message.direction || '').toLowerCase() === 'inbound';
                      const when = formatWhen(message.createdAt);
                      return (
                        <div
                          key={message.id}
                          className={`rounded-2xl border px-3.5 py-3 text-xs leading-relaxed ${
                            inbound
                              ? 'border-[#FFA84A]/25 bg-[#FFA84A]/[0.06] mr-6'
                              : 'border-white/10 bg-white/[0.03] ml-6'
                          }`}
                        >
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-slate-500">
                              {inbound ? 'Prospect' : 'You'}
                            </span>
                            {when && <span className="text-[10px] text-slate-600">{when}</span>}
                          </div>
                          {message.subject && <p className="font-semibold text-white mb-1">{message.subject}</p>}
                          <p className="whitespace-pre-wrap text-slate-300">{message.body}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="space-y-3 border-t border-white/[0.06] pt-4 mt-auto">
                  <div className="space-y-1.5">
                    <label htmlFor="outreach-reply-subject" className={LABEL}>Subject</label>
                    <input
                      id="outreach-reply-subject"
                      value={reply.subject}
                      onChange={(event) => setReply((current) => ({ ...current, subject: event.target.value }))}
                      placeholder="Subject"
                      disabled={busy === 'reply' || busy === 'reply-send'}
                      className={FIELD}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="outreach-reply-body" className={LABEL}>Reply</label>
                    <textarea
                      id="outreach-reply-body"
                      value={reply.body}
                      onChange={(event) => setReply((current) => ({ ...current, body: event.target.value }))}
                      rows={5}
                      placeholder="Write a reply…"
                      disabled={busy === 'reply' || busy === 'reply-send'}
                      className={`${FIELD} leading-relaxed resize-y`}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={draftReply} disabled={!inboxId || isBusy} className={GHOST_BTN}>
                      {busy === 'reply' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Drafting…
                        </>
                      ) : (
                        'Draft reply'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={sendReply}
                      disabled={!inboxId || !reply.subject || !reply.body || isBusy}
                      className={PRIMARY_BTN}
                    >
                      {busy === 'reply-send' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" /> Send reply
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setThread(null);
                        setThreadError('');
                      }}
                      className={GHOST_BTN}
                      disabled={isBusy}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <InboxCreateDialog
        open={showInboxDialog}
        busy={busy === 'inbox'}
        onCancel={() => setShowInboxDialog(false)}
        onCreate={createInbox}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title || ''}
        body={confirm?.body || ''}
        confirmLabel={confirm?.confirmLabel || 'Confirm'}
        danger={Boolean(confirm?.danger)}
        busy={busy === 'send' || busy === 'delete' || busy === 'draft'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm?.()}
      />
    </div>
  );
}
