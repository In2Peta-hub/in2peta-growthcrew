// One person on the review list. Three layouts:
//   pending — Keep (primary) or Skip; K/S on a focused row.
//   kept    — the editable first message, autosaved on blur, copy / Gmail.
//   skipped — quiet, with "Keep" to take it back.
// Skip leaves with a short fade; keyboard skips and all reduced-motion
// environments remove the row with no animation (movements follow the
// workspace motion brief).

import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { gmailComposeUrl, OFFER_PLACEHOLDER } from './finderApi';

// Mounts when a kept lead first has a message, and stays mounted while the
// row is kept — so typed-but-unsaved edits survive the save round-trip.
function MessageEditor({ lead, initial, onSave }) {
  const id = useId();
  const [draft, setDraft] = useState({
    subject: initial?.subject || '',
    body: initial?.body || '',
  });
  const lastSaved = useRef({ subject: initial?.subject || '', body: initial?.body || '' });
  const savingRef = useRef(false);
  const [saved, setSaved] = useState('');
  const savedTimer = useRef(null);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);

  const flash = (what, timer, set) => {
    set(what);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => set(''), 2000);
  };

  const save = () => {
    if (savingRef.current) return;
    const last = lastSaved.current;
    if (last.subject === draft.subject.trim() && last.body === draft.body) return;
    savingRef.current = true;
    flash('Saving…', savedTimer, setSaved);
    Promise.resolve(onSave(lead.key, draft.subject.trim(), draft.body))
      .then(() => {
        lastSaved.current = { subject: draft.subject.trim(), body: draft.body };
        flash('Saved', savedTimer, setSaved);
      })
      .catch(() => flash('Did not save. Try again.', savedTimer, setSaved))
      .finally(() => {
        savingRef.current = false;
      });
  };

  // Take server-side changes (e.g. the offer line filled in) while the user
  // has nothing unsaved; never overwrite their own edits.
  useEffect(() => {
    const next = { subject: initial?.subject || '', body: initial?.body || '' };
    setDraft((current) => {
      const last = lastSaved.current;
      const clean = current.subject.trim() === last.subject && current.body === last.body;
      if (!clean || (next.subject === last.subject && next.body === last.body)) return current;
      lastSaved.current = next;
      return next;
    });
  }, [initial?.subject, initial?.body]);

  const edit = (part) => (event) =>
    setDraft((prev) => ({ ...prev, [part]: event.target.value }));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${draft.subject}\n\n${draft.body}`);
      setCopied(true);
    } catch {
      setCopied(false);
    } finally {
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="ui-panel-inset fn-editor">
      <div className="fn-editor-fields">
        <div>
          <label className="ui-label" htmlFor={`${id}-subject`}>Subject</label>
          <input
            id={`${id}-subject`}
            className="ui-input"
            type="text"
            value={draft.subject}
            maxLength={120}
            onChange={edit('subject')}
            onBlur={save}
          />
        </div>
        <div>
          <label className="ui-label" htmlFor={`${id}-body`}>Message</label>
          <textarea
            id={`${id}-body`}
            className="ui-textarea"
            rows={6}
            value={draft.body}
            onChange={edit('body')}
            onBlur={save}
          />
        </div>
      </div>
      <div className="fn-editor-actions">
        <a
          className="ui-btn ui-btn-primary"
          href={gmailComposeUrl(lead.email, draft.subject.trim(), draft.body)}
          target="_blank"
          rel="noreferrer"
        >
          Open in Gmail <ExternalLink aria-hidden="true" />
        </a>
        <button type="button" className="ui-btn" onClick={copy}>
          {copied ? <><Check aria-hidden="true" /> Copied</> : <><Copy aria-hidden="true" /> Copy</>}
        </button>
        <span className="fn-saved" role="status">{saved}</span>
      </div>
      {draft.body.includes(OFFER_PLACEHOLDER) && (
        <p className="ui-hint fn-placeholder-hint">
          Replace the line in brackets with what you offer before you send it.
        </p>
      )}
    </div>
  );
}

export default function LeadRow({
  lead,
  layout = 'pending',
  deciding = null,
  leaving = null,
  arrive = undefined,
  onKeep,
  onSkip,
  onSave,
}) {
  const message = lead.message;

  // K / S work only while the row itself has focus (not while typing or
  // when a button inside it has focus), and they never animate.
  const onKeyDown = (event) => {
    if (layout !== 'pending' || event.target !== event.currentTarget) return;
    const key = event.key.toLowerCase();
    if (key === 'k') {
      event.preventDefault();
      onKeep({ instant: true });
    } else if (key === 's') {
      event.preventDefault();
      onSkip({ instant: true });
    }
  };

  const meta = [lead.role, lead.name ? lead.company : null, lead.city].filter(Boolean).join(' · ');

  // "Writing a first message…" while the keep decision writes the message —
  // this is the one step that can take a while, so the words stay honest.
  const keeping = typeof deciding === 'string' && deciding.startsWith('keep');
  const writing = (keeping && !message) || (layout === 'kept' && !message);

  return (
    <li
      tabIndex={0}
      className={`fn-row${leaving ? ` fn-row-leave fn-row-leave-${leaving}` : ''}${arrive != null ? ' ui-arrive' : ''}`}
      style={arrive != null ? { '--i': arrive } : undefined}
      onKeyDown={onKeyDown}
    >
      <div className="fn-lead-head">
        <p className="fn-lead-name">{lead.name || lead.company}</p>
        {layout === 'kept' && lead.email && <p className="fn-lead-email">{lead.email}</p>}
        {meta && <p className="fn-lead-meta">{meta}</p>}
        <p className="fn-why">{lead.why}</p>
      </div>

      {layout === 'pending' && writing && (
        <p className="fn-writing" role="status">
          <Loader2 className="ui-spin" aria-hidden="true" />
          Writing a first message…
        </p>
      )}

      {layout === 'pending' && !writing && (
        <div className="fn-row-actions">
          <button type="button" className="ui-btn" disabled={!!deciding} onClick={() => onKeep({})}>
            <Check aria-hidden="true" /> Keep
          </button>
          <button type="button" className="ui-btn ui-btn-ghost" disabled={!!deciding} onClick={() => onSkip({})}>
            Skip
          </button>
        </div>
      )}

      {layout === 'kept' &&
        (message ? (
          <MessageEditor lead={lead} initial={message} onSave={onSave} />
        ) : (
          <p className="fn-writing" role="status">
            <Loader2 className="ui-spin" aria-hidden="true" />
            Writing a first message…
          </p>
        ))}

      {layout === 'skipped' && !writing && (
        <div className="fn-row-actions">
          <button type="button" className="ui-btn ui-btn-ghost" disabled={!!deciding} onClick={() => onKeep({})}>
            Keep
          </button>
        </div>
      )}

      {layout === 'skipped' && writing && (
        <p className="fn-writing" role="status">
          <Loader2 className="ui-spin" aria-hidden="true" />
          Writing a first message…
        </p>
      )}
    </li>
  );
}
