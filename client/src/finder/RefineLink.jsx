// The small "Refine" link in the list header. Opens a dialog with the
// sharpening questions phrased as questions (spec §1: defaults over
// settings). Primary "Find 10 people" runs a new batch with the refine
// body. Escape and a click on the scrim close it.

import React, { useEffect, useId, useRef, useState } from 'react';

function RefineDialog({ initial, busy, onClose, onFind }) {
  const id = useId();
  const [who, setWho] = useState(initial?.who || '');
  const [where, setWhere] = useState(initial?.where || '');
  const [runsTheCompany, setRunsTheCompany] = useState(false);
  const scrimRef = useRef(null);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = () => {
    if (busy || who.trim().length < 3) return;
    const refine = {};
    if (who.trim()) refine.who = who.trim();
    if (where.trim()) refine.where = where.trim();
    if (runsTheCompany) refine.runsTheCompany = true;
    onFind(refine);
    onClose();
  };

  return (
    <div
      className="ui-scrim"
      ref={scrimRef}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} className="ui-dialog fn-refine">
        <h2 id={`${id}-title`} className="ui-panel-title">Change what we look for</h2>
        <form className="fn-refine-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
          <div>
            <label className="ui-label" htmlFor={`${id}-who`}>Who exactly?</label>
            <input
              id={`${id}-who`}
              className="ui-input"
              type="text"
              value={who}
              maxLength={200}
              autoFocus
              onChange={(event) => setWho(event.target.value)}
            />
          </div>
          <div>
            <label className="ui-label" htmlFor={`${id}-where`}>Somewhere else?</label>
            <input
              id={`${id}-where`}
              className="ui-input"
              type="text"
              value={where}
              maxLength={120}
              onChange={(event) => setWhere(event.target.value)}
            />
          </div>
          <label className="fn-switch">
            <input
              type="checkbox"
              role="switch"
              checked={runsTheCompany}
              onChange={(event) => setRunsTheCompany(event.target.checked)}
            />
            <span className="fn-switch-track" aria-hidden="true" />
            <span>Only people who run the company?</span>
          </label>
          <div className="fn-refine-actions">
            <button type="button" className="ui-btn ui-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ui-btn ui-btn-primary" disabled={busy || who.trim().length < 3}>
              Find 10 people
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RefineLink({ open, initial, busy, onOpen, onClose, onFind }) {
  return (
    <>
      <button type="button" className="ui-link" onClick={onOpen}>
        Refine
      </button>
      {open && (
        <RefineDialog
          key={initial ? `${initial.who}|${initial.where}` : 'understood'}
          initial={initial}
          busy={busy}
          onClose={onClose}
          onFind={onFind}
        />
      )}
    </>
  );
}
