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
import Segmented from './ui/Segmented';
import { outreachApi } from './api';

const FIELD = 'ui-input';
const LABEL = 'ui-label';
const GHOST_BTN = 'ui-btn ui-btn-ghost ui-btn-sm';
const PRIMARY_BTN = 'ui-btn ui-btn-primary';
const DANGER_BTN = 'ui-btn ui-btn-danger';
const CARD = 'ui-panel space-y-5';
const CARD_HEADER = 'flex items-center justify-between gap-3';

const STATUS_META = {
  NEW: { label: 'New', tone: '' },
  SAVED: { label: 'Saved', tone: 'ui-badge-accent' },
  SENT: { label: 'Sent', tone: 'ui-badge-good' },
  REPLIED: { label: 'Replied', tone: 'ui-badge-accent' },
  FAILED: { label: 'Failed', tone: 'ui-badge-bad' },
  DRAFT: { label: 'Draft', tone: 'ui-badge-warn' },
  PENDING_REPLY: { label: 'Awaiting reply', tone: 'ui-badge-warn' },
};

// All outreach requests go through the shared API client: one base URL and one
// error shape for the whole app, same as the social studio.
const outreach = (path, init) => outreachApi(path, init);

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
    <span className={`ui-badge shrink-0 ${meta.tone}`}>{meta.label}</span>
  );
}

function NoticeBanner({ notice, onDismiss }) {
  if (!notice?.text) return null;
  const isError = notice.tone === 'error';
  const tone =
    notice.tone === 'error' ? 'var(--ui-bad)' : notice.tone === 'success' ? 'var(--ui-good)' : 'var(--ui-muted)';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className="ui-panel-inset mt-4 flex items-start gap-3 text-sm"
      style={{ color: tone }}
    >
      {isError && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
      <p className="min-w-0 flex-1 leading-relaxed">{notice.text}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="ui-btn ui-btn-ghost ui-btn-icon ui-btn-sm shrink-0"
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
    <div className="ui-scrim" role="presentation" onClick={() => !busy && onCancel()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="ui-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id={titleId} className="ui-panel-title">{title}</h3>
        <p className="ui-sub mt-2">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button ref={cancelRef} type="button" disabled={busy} onClick={onCancel} className={GHOST_BTN}>
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={danger ? DANGER_BTN : PRIMARY_BTN}
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
    <div className="ui-scrim" role="presentation" onClick={() => !busy && onCancel()}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="ui-dialog space-y-4"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = displayName.trim();
          if (!trimmed || busy) return;
          onCreate(trimmed);
        }}
      >
        <div>
          <h3 id={titleId} className="ui-panel-title">New sending inbox</h3>
          <p className="ui-sub mt-2">
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
                <Loader2 className="ui-spin h-3.5 w-3.5" /> Creating…
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
    <div className="ui-panel-inset flex min-h-[7.5rem] items-center justify-center text-center">
      <p className="ui-hint max-w-sm">{children}</p>
    </div>
  );
}

function LoadingRows({ label }) {
  return (
    <div
      className="ui-panel-inset flex min-h-[7.5rem] flex-col items-center justify-center gap-3"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="ui-spin h-6 w-6 text-[var(--ui-lavender)]" aria-hidden="true" />
      <p className="ui-hint">{label}</p>
    </div>
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
            <h2 className="ui-title">
              Find leads &amp; send
            </h2>
            <p className="ui-sub mt-1">Search, draft, and manage replies.</p>
          </div>
          <div className="self-start md:self-center">
            <Segmented
              name="sending-mode"
              label="Sending mode"
              value={reviewFirst ? 'review' : 'auto'}
              onChange={(value) => {
                if (busy === 'mode' || booting) return;
                saveSendingMode(value === 'review' ? 'manual' : 'auto');
              }}
              options={[
                { value: 'review', label: 'Review first' },
                { value: 'auto', label: 'Send immediately' },
              ]}
            />
          </div>
        </div>
        <NoticeBanner notice={notice} onDismiss={clearNotice} />
        {booting && (
          <p className="flex items-center gap-2 text-sm ui-hint">
            <Loader2 className="h-4 w-4 ui-spin" style={{ color: 'var(--ui-lavender)' }} /> Loading…
          </p>
        )}
        {bootError && !booting && (
          <div className="ui-panel-inset flex items-center gap-2 text-sm" role="alert" style={{ color: 'var(--ui-bad)' }}>
            Couldn’t load Outreach. {bootError}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-7 space-y-6">
          <form onSubmit={runSearch} className={CARD}>
            <div className={CARD_HEADER}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="min-w-0">
                  <h3 className="ui-panel-title">1. Find leads</h3>
                  <p className="ui-hint mt-0.5">Search your lead database and the live web, or upload a CSV</p>
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
                    <Loader2 className="ui-spin w-4 h-4" /> Searching…
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" /> Search leads
                  </>
                )}
              </button>
              <label
                className={`${GHOST_BTN} ${isBusy ? 'opacity-50 pointer-events-none' : ''}`}
                aria-disabled={isBusy}
              >
                {busy === 'upload' ? (
                  <>
                    <Loader2 className="ui-spin w-4 h-4" /> Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Upload CSV
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

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="ui-hint">
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

            <div className="ui-panel-inset max-h-64 overflow-auto space-y-1">
              {busy === 'search' || busy === 'upload' ? (
                <LoadingRows label={busy === 'upload' ? 'Reading CSV…' : 'Searching…'} />
              ) : found.length === 0 ? (
                <EmptyState>
                  {searchAttempted ? 'No leads found. Adjust the search or upload a CSV.' : 'Search or upload a CSV to get started.'}
                </EmptyState>
              ) : (
                found.map((lead, index) => {
                  const checked = Boolean(selected[lead.email]);
                  const rowBg = checked
                    ? 'var(--ui-accent-soft)'
                    : index % 2
                      ? 'var(--ui-raised)'
                      : 'transparent';
                  return (
                    <label
                      key={lead.email}
                      className="flex items-start gap-3 rounded-md px-3 py-2.5 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-[var(--ui-lavender)]/40"
                      style={{ background: rowBg }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleLead(lead.email)}
                        className="mt-1 h-4 w-4 rounded focus:ring-[var(--ui-lavender)]/40"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold truncate">{lead.company || lead.name || 'Lead'}</span>
                        <span className="block ui-hint truncate">
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
                <div className="min-w-0">
                  <h3 className="ui-panel-title">2. Sending inbox</h3>
                  <p className="ui-hint mt-0.5">Where emails send from</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInboxDialog(true)}
                disabled={isBusy}
                className={`${GHOST_BTN} shrink-0`}
              >
                <Plus className="h-3.5 w-3.5" /> New inbox
              </button>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="outreach-from-inbox" className={LABEL}>From inbox</label>
              <select
                id="outreach-from-inbox"
                value={inboxId}
                onChange={(event) => setInboxId(event.target.value)}
                disabled={isBusy}
                className="ui-select"
              >
                <option value="">Select an inbox</option>
                {inboxes.map((inbox) => (
                  <option key={inbox.id} value={inbox.id}>{inbox.label}</option>
                ))}
              </select>
            </div>

            {inboxLoadError && (
              <p className="ui-panel-inset text-sm" role="alert" style={{ color: 'var(--ui-bad)' }}>{inboxLoadError}</p>
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
                  <Loader2 className="ui-spin w-4 h-4" /> Working…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> {draftLabel}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="xl:col-span-5 space-y-6">
          <div className={CARD}>
            <div className={CARD_HEADER}>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4" style={{ color: 'var(--ui-lavender)' }} aria-hidden="true" />
                <h3 className="ui-panel-title">Email review</h3>
              </div>
              {drafts.length > 0 && (
                <span className="ui-badge tabular-nums">
                  {Math.min(activeDraft + 1, drafts.length)} of {drafts.length}
                </span>
              )}
            </div>

            <form onSubmit={addManualLead} className="ui-panel-inset space-y-2.5">
              <p className="ui-label" style={{ marginBlockEnd: 0 }}>Add lead manually</p>
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
                <p className="ui-hint">Choose a sending inbox first to enable manual entry.</p>
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
                    <p className="text-sm font-semibold truncate">{draft.company || draft.name || 'Lead'}</p>
                    <p className="ui-hint truncate">{draft.email}</p>
                  </div>
                  {draft.status === 'failed' && <StatusChip status="FAILED" />}
                </div>

                {draft.status === 'failed' ? (
                  <p className="ui-panel-inset text-sm" role="alert" style={{ color: 'var(--ui-bad)' }}>
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
                        className="ui-textarea min-h-[220px]"
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
                        <Loader2 className="ui-spin w-4 h-4" /> Sending…
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Approve &amp; send
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
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveDraft((index) => Math.max(0, index - 1))}
                      disabled={activeDraft === 0 || isBusy}
                      className={GHOST_BTN}
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveDraft((index) => Math.min(drafts.length - 1, index + 1))}
                      disabled={activeDraft >= drafts.length - 1 || isBusy}
                      className={GHOST_BTN}
                    >
                      Next <ChevronRight className="w-4 h-4" />
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
                <Inbox className="w-4 h-4" style={{ color: 'var(--ui-lavender)' }} aria-hidden="true" />
                <h3 className="ui-panel-title">Sent &amp; replies</h3>
              </div>
              <button
                type="button"
                onClick={pullReplies}
                disabled={!inboxId || isBusy}
                className={GHOST_BTN}
              >
                {busy === 'relay' ? (
                  <Loader2 className="ui-spin h-3.5 w-3.5" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Pull replies
              </button>
            </div>

            <div className="ui-panel-inset max-h-[28rem] overflow-auto space-y-1">
              {booting ? (
                <LoadingRows label="Loading leads…" />
              ) : leads.length === 0 ? (
                <EmptyState>Leads show up here after you draft or send.</EmptyState>
              ) : (
                leads.map((lead, index) => {
                  const active = thread?.lead?.id === lead.id;
                  const rowBg = active
                    ? 'var(--ui-accent-soft)'
                    : index % 2
                      ? 'var(--ui-raised)'
                      : 'transparent';
                  return (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between gap-2 rounded-md px-3 py-2.5 transition-colors focus-within:ring-2 focus-within:ring-[var(--ui-lavender)]/40"
                      style={{ background: rowBg }}
                    >
                      <button
                        type="button"
                        onClick={() => openThread(lead)}
                        disabled={busy === 'thread'}
                        className="text-left min-w-0 flex-1 cursor-pointer focus:outline-none disabled:opacity-60"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="block text-sm font-semibold truncate">{lead.company || lead.name || lead.email}</span>
                          <StatusChip status={lead.status} />
                        </span>
                        <span className="block ui-hint truncate mt-0.5">
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
                        className="shrink-0 rounded-md p-1.5 text-[var(--ui-faint)] transition-colors hover:text-[var(--ui-bad)] hover:bg-[color-mix(in_oklch,var(--ui-bad)_16%,transparent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-bad)]/40 cursor-pointer disabled:opacity-50"
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
                <h3 className="ui-panel-title">Conversation</h3>
                <p className="ui-hint mt-0.5 truncate">
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
                          className={`rounded-xl px-3.5 py-3 text-[13px] leading-relaxed ${
                            inbound ? 'mr-6' : 'ml-6'
                          }`}
                          style={{ background: inbound ? 'var(--ui-raised)' : 'var(--ui-step)' }}
                        >
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className="ui-hint font-semibold">
                              {inbound ? 'Prospect' : 'You'}
                            </span>
                            {when && <span className="ui-hint">{when}</span>}
                          </div>
                          {message.subject && <p className="font-semibold mb-1">{message.subject}</p>}
                          <p className="whitespace-pre-wrap">{message.body}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="space-y-3 pt-4 mt-auto">
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
                      className="ui-textarea"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={draftReply} disabled={!inboxId || isBusy} className={GHOST_BTN}>
                      {busy === 'reply' ? (
                        <>
                          <Loader2 className="ui-spin w-4 h-4" /> Drafting…
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
                          <Loader2 className="ui-spin w-4 h-4" /> Sending…
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
