// The autopilot card at the end of the list. One switch turns the Monday
// email on or off; one "Connect" button opens a menu whose only item is a
// CSV download of the kept leads.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { downloadExport } from './finderApi';

export default function AutopilotCard({ account, onToggle }) {
  const enabled = Boolean(account?.autopilot?.enabled);
  const nextRunAt = account?.autopilot?.nextRunAt;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // "Next email: Monday, 26 October, 8:00" — in whatever locale the user runs.
  const nextRun = useMemo(() => {
    if (!nextRunAt) return null;
    const date = new Date(nextRunAt);
    if (Number.isNaN(date.getTime())) return null;
    try {
      return new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: 'numeric',
        minute: '2-digit',
      }).format(date);
    } catch {
      return date.toISOString();
    }
  }, [nextRunAt]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const onDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [menuOpen]);

  const toggle = async () => {
    setBusy(true);
    setError('');
    try {
      await onToggle(!enabled);
    } catch {
      setError('Could not change that. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ui-panel fn-autopilot" aria-busy={busy}>
      <div className="fn-autopilot-main">
        <label className="fn-switch">
          <input
            type="checkbox"
            role="switch"
            checked={enabled}
            disabled={busy}
            onChange={toggle}
          />
          <span className="fn-switch-track" aria-hidden="true" />
          <span className="fn-switch-label">Send me 10 more like these every Monday</span>
        </label>
        {enabled && nextRun && <p className="ui-hint fn-autopilot-next">Next email: {nextRun}</p>}
        {error && <p className="fn-error" role="alert">{error}</p>}
      </div>

      <div className="fn-connect" ref={menuRef}>
        <button
          type="button"
          className="ui-btn"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          Connect
        </button>
        {menuOpen && (
          <div role="menu" className="ui-menu fn-connect-menu" style={{ '--ui-origin': 'top right' }}>
            <button
              type="button"
              className="ui-menu-item"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                downloadExport().catch(() => setError('Could not download the file. Try again.'));
              }}
            >
              <Download aria-hidden="true" /> Download CSV
            </button>
            <p className="fn-connect-hint">Opens in Google Sheets, Excel or any CRM.</p>
          </div>
        )}
      </div>
    </section>
  );
}
