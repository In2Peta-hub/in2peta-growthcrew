// The whole signed-in product: one screen, one question — "Who should I
// talk to next?" Spec: docs/lead-finder-spec.md §1 (steps 4–5) and §6.
//
// Flow: sign-in lands here with the first five people. Each row takes one
// decision (keep/skip). Kept rows grow a first message. When the list is
// empty, "Show 10 more like these" (or Refine) starts a batch and new rows
// arrive with a short settle. The Monday email and the CSV export live in
// the autopilot card at the bottom.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, LogOut, Sparkles } from 'lucide-react';
import Segmented from '../ui/Segmented';
import LeadRow from './LeadRow';
import RefineLink from './RefineLink';
import AutopilotCard from './AutopilotCard';
import OfferPrompt from './OfferPrompt';
import {
  clearSession,
  decide,
  getBatch,
  listLeads,
  me,
  pollUntilSettled,
  saveMessage,
  setAutopilot,
  startBatch,
} from './finderApi';
import './finder.css';

const ARRIVAL_CLEAR_MS = 1600;

// A suggested sentence ("dentists in Maharashtra") becomes refine fields.
const splitSuggestion = (sentence) => {
  const match = sentence.match(/^(.*?)\s+(?:in|near|around)\s+(.+)$/i);
  return match ? { who: match[1], where: match[2] } : { who: sentence, where: '' };
};

const omitKey = (map, key) => {
  const { [key]: _drop, ...rest } = map;
  return rest;
};

export default function ReviewScreen({
  session,
  initialAccount = null,
  turnAutopilotOff = false,
  onAutopilotHandled,
  onHome,
  onOpenSocial,
  onSignOut,
  onSessionExpired,
}) {
  // Mount-only effects and runtime handlers read parent props (which the
  // parent may recreate at any time) through this ref; it is filled after
  // every render, before any other effect runs.
  const latest = useRef(null);
  useEffect(() => {
    latest.current = { initialAccount, onAutopilotHandled, onSessionExpired };
  });

  const [account, setAccount] = useState(initialAccount);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('pending');
  const [busyKeys, setBusyKeys] = useState({}); // lead key → decision token
  const [leaving, setLeaving] = useState({});   // lead key → 'anim' | 'instant'
  const [arrivals, setArrivals] = useState({}); // lead key → ui-arrive stagger index
  const [toast, setToast] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [refine, setRefine] = useState({ open: false, initial: null });
  const [batch, setBatch] = useState({ state: 'idle', error: '', suggestions: [] });
  const [elapsed, setElapsed] = useState(0);

  const menuRef = useRef(null);
  const toastTimer = useRef(null);
  const decideSeq = useRef({}); // per lead: the newest decision wins
  const knownKeys = useRef(new Set());

  const showToast = useCallback((next) => {
    setToast(next);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 6000);
  }, []);

  // Render the list, and let fresh rows settle in once with ui-arrive.
  const putList = useCallback((list, fresh = null) => {
    setLeads(list);
    knownKeys.current = new Set(list.map((l) => l.key));
    const staggered = fresh || list;
    const stagger = {};
    staggered.forEach((l, index) => {
      stagger[l.key] = index;
    });
    setArrivals(stagger);
    window.setTimeout(() => {
      setArrivals((prev) => (prev === stagger ? {} : prev));
    }, ARRIVAL_CLEAR_MS);
  }, []);

  const loadList = useCallback(
    () =>
      listLeads('all')
        .then((res) => putList(res.leads || []))
        .finally(() => setLoading(false)),
    [putList],
  );

  const onAuthFail = useCallback(() => {
    clearSession();
    latest.current.onSessionExpired();
  }, []);

  // Account + list on mount.
  useEffect(() => {
    const handleError = (err) => {
      if (err?.status === 401) {
        onAuthFail();
      } else {
        setError(err?.message || 'We could not load your list.');
      }
    };
    if (!latest.current.initialAccount) {
      me()
        .then((res) => setAccount(res.account))
        .catch(handleError);
    }
    loadList().catch(handleError);
  }, [loadList, onAuthFail]);

  // A sign-in link with ?autopilot=off turns the weekly email off once.
  useEffect(() => {
    if (!turnAutopilotOff) return;
    setAutopilot(false)
      .then((res) => {
        setAccount((prev) => prev || res.account);
        showToast({ message: 'Weekly emails are off.' });
      })
      .catch((err) => {
        if (err?.status === 401) onAuthFail();
      })
      .finally(() => latest.current.onAutopilotHandled());
  }, [turnAutopilotOff, showToast, onAuthFail]);

  // Account menu: Escape and outside click close it.
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

  // A calm progress line counts the seconds a batch has been running.
  // (elapsed resets in startRun, next to the state that starts the run.)
  useEffect(() => {
    if (batch.state !== 'running') return undefined;
    const timer = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - batch.startedAt) / 1000)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [batch.state, batch.startedAt]);

  const counts = useMemo(
    () => ({
      pending: leads.filter((l) => l.status === 'pending').length,
      kept: leads.filter((l) => l.status === 'kept').length,
      skipped: leads.filter((l) => l.status === 'skipped').length,
    }),
    [leads],
  );

  // Pending view shows the people still to review plus kept rows (in
  // place, with their message editor). While a skip animates out, the row
  // also stays in the pending view.
  const rows = useMemo(
    () =>
      leads.filter((l) => {
        if (l.key in leaving) return view === 'pending';
        if (view === 'pending') return l.status === 'pending' || l.status === 'kept';
        return l.status === view;
      }),
    [leads, leaving, view],
  );

  // The "that's everyone" block is about work left to do, not about what is
  // visible: kept rows keep rendering above it.
  const pendingCount = useMemo(
    () => leads.filter((l) => l.status === 'pending').length,
    [leads],
  );

  const applyLead = useCallback((lead) => {
    if (!lead) return;
    setLeads((prev) => prev.map((l) => (l.key === lead.key ? lead : l)));
  }, []);

  const undoSkip = useCallback((key) => {
    decideSeq.current[key] = (decideSeq.current[key] || 0) + 1; // invalidate the in-flight skip
    setLeads((prev) => prev.map((l) => (l.key === key ? { ...l, status: 'pending' } : l)));
    setLeaving((prev) => omitKey(prev, key));
    setBusyKeys((prev) => omitKey(prev, key));
    setToast(null);
    // Persist it, so the person is still there after a reload.
    decide(key, 'undo').catch(() => showToast({ message: 'Undo did not save. Try again.' }));
  }, [showToast]);

  const runDecide = useCallback(
    (lead, decision, { instant = false } = {}) => {
      if (busyKeys[lead.key]) return;
      decideSeq.current[lead.key] = (decideSeq.current[lead.key] || 0) + 1;
      const seq = decideSeq.current[lead.key];
      const token = `${decision}-${seq}`;

      if (decision === 'skip') {
        setLeads((prev) =>
          prev.map((l) => (l.key === lead.key ? { ...l, status: 'skipped' } : l)),
        );
        setLeaving((prev) => ({ ...prev, [lead.key]: instant ? 'instant' : 'anim' }));
        showToast({
          message: 'Skipped.',
          action: { label: 'Undo', onClick: () => undoSkip(lead.key) },
        });
      } else {
        setBusyKeys((prev) => ({ ...prev, [lead.key]: token }));
      }

      decide(lead.key, decision)
        .then((res) => {
          if (decideSeq.current[lead.key] === seq) applyLead(res.lead);
        })
        .catch((err) => {
          if (decideSeq.current[lead.key] !== seq) return;
          if (err?.status === 401) {
            latest.current.onSessionExpired();
            return;
          }
          if (decision === 'skip') {
            setLeads((prev) =>
              prev.map((l) => (l.key === lead.key ? { ...l, status: 'pending' } : l)),
            );
            showToast({ message: 'That did not go through. Try again.' });
          } else {
            showToast({ message: err?.message || 'Could not keep that one. Try again.' });
          }
        })
        .finally(() => {
          setBusyKeys((prev) =>
            prev[lead.key] === token ? omitKey(prev, lead.key) : prev,
          );
          if (decision === 'skip' && decideSeq.current[lead.key] === seq) {
            setLeaving((prev) => omitKey(prev, lead.key));
          }
        });
    },
    [busyKeys, applyLead, undoSkip, showToast],
  );

  // Save-on-blur: acknowledge through the returned lead, so the "Saved"
  // hint and the editor stay in sync with the server.
  const handleSaveMessage = useCallback(
    (key, subject, body) =>
      saveMessage(key, subject, body).then((res) => {
        applyLead(res.lead);
        return res;
      }),
    [applyLead],
  );

  const handleAutopilotToggle = useCallback(
    (enabled) =>
      setAutopilot(enabled).then((res) => {
        setAccount(res.account);
        return res;
      }),
    [],
  );

  const startRun = (refine) => {
    if (batch.state === 'running') return;
    setRefine((r) => ({ ...r, open: false }));
    setView('pending');
    setElapsed(0);
    setBatch({ state: 'running', startedAt: Date.now(), error: '', suggestions: [] });
    startBatch(10, refine)
      .then(({ batchId }) => pollUntilSettled(() => getBatch(batchId)))
      .then(async (settled) => {
        if (!settled || settled.status === 'failed') {
          setBatch({
            state: 'failed',
            error: settled?.error || 'The search stopped before it finished.',
            suggestions: [],
          });
          return;
        }
        if (settled.status === 'empty' || !(settled.leads?.length)) {
          setBatch({ state: 'empty', error: '', suggestions: settled.suggestions || [] });
          return;
        }
        const res = await listLeads('all');
        const list = res.leads || [];
        const fresh = list.filter((l) => !knownKeys.current.has(l.key));
        putList(list, fresh.length ? fresh : list);
        setBatch({ state: 'idle', error: '', suggestions: [] });
        setView('pending');
      })
      .catch((err) => {
        if (err?.status === 401) {
          onAuthFail();
        } else {
          setBatch({
            state: 'failed',
            error: err?.message || 'The search could not finish. Try again in a moment.',
            suggestions: [],
          });
        }
      });
  };

  const openRefine = (prefill = null) => setRefine({ open: true, initial: prefill });
  const closeRefine = () => setRefine((r) => ({ ...r, open: false }));
  // The header Refine opens on the current search, so the questions read as
  // an edit of what we look for now rather than a blank form.
  const openHeaderRefine = () =>
    openRefine({
      who: account?.understood?.who || '',
      where: account?.understood?.where || '',
    });

  const retry = () => {
    setError('');
    setLoading(true);
    loadList().catch((err) => {
      if (err?.status === 401) onAuthFail();
      else {
        setError(err?.message || 'We could not load your list.');
        setLoading(false);
      }
    });
  };

  const avatarInitial = (session?.email?.[0] || 'G').toUpperCase();

  return (
    <div className="fn-app">
      <header className="fn-header">
        <div className="fn-header-in">
          <button
            type="button"
            className="fn-wordmark"
            onClick={onHome}
            aria-label="GrowthCrew: back to the home page"
          >
            <img className="brand-logo" src="/brand/in2peta-logo.png" alt="" width="36" height="36" />
            <span className="fn-wordmark-text">GrowthCrew</span>
          </button>

          <div className="fn-account" ref={menuRef}>
            <button
              type="button"
              className="ui-btn ui-btn-ghost ui-btn-icon rounded-full bg-[var(--ui-raised)]"
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`Account menu for ${session?.email || 'your account'}`}
            >
              {avatarInitial}
            </button>
            {menuOpen && (
              <div role="menu" className="ui-menu fn-account-menu" style={{ '--ui-origin': 'top right' }}>
                <div className="fn-account-email">
                  <p className="ui-hint">{session?.email}</p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  className="ui-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenSocial();
                  }}
                >
                  <Sparkles aria-hidden="true" /> Social Studio
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="ui-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onSignOut();
                  }}
                >
                  <LogOut aria-hidden="true" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="fn-main">
        <div className="fn-head">
          <div className="fn-head-row">
            <h1 className="ui-title fn-title">{account?.describe ? account.describe[0].toUpperCase() + account.describe.slice(1) : 'Your list'}</h1>
            {account && (
              <RefineLink
                open={refine.open}
                initial={refine.initial}
                busy={batch.state === 'running'}
                onOpen={openHeaderRefine}
                onClose={closeRefine}
                onFind={startRun}
              />
            )}
          </div>
          <Segmented
            block
            name="lead-views"
            label="Which people to show"
            value={view}
            onChange={setView}
            options={[
              { value: 'pending', label: `To review (${counts.pending})` },
              { value: 'kept', label: `Kept (${counts.kept})` },
              { value: 'skipped', label: `Skipped (${counts.skipped})` },
            ]}
          />
        </div>

        {account && !account.understood?.offer && !loading && !error && (
          <OfferPrompt
            onSaved={(next) => {
              setAccount(next);
              loadList().catch(() => {});
            }}
          />
        )}

        {error ? (
          <div className="ui-panel fn-state">
            <h2 className="ui-panel-title">Something went wrong</h2>
            <p className="ui-sub">{error}</p>
            <button type="button" className="ui-btn" onClick={retry}>Try again</button>
          </div>
        ) : loading ? (
          <div className="fn-list" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div className="fn-skel" key={i} />
            ))}
          </div>
        ) : (
          <>
            <ul className="fn-list" aria-label={account?.describe || 'Your list'}>
              {rows.map((lead) => {
                const layout =
                  view === 'pending' && (lead.status === 'pending' || lead.key in leaving)
                    ? 'pending'
                    : lead.status;
                return (
                  <LeadRow
                    key={lead.key}
                    lead={lead}
                    layout={layout}
                    deciding={busyKeys[lead.key] || null}
                    leaving={leaving[lead.key] || null}
                    arrive={arrivals[lead.key]}
                    onKeep={(opts) => runDecide(lead, 'keep', opts)}
                    onSkip={(opts) => runDecide(lead, 'skip', opts)}
                    onSave={handleSaveMessage}
                  />
                );
              })}
            </ul>

            {batch.state === 'running' && (
              <p className="fn-progress" role="status">
                <Loader2 className="ui-spin" aria-hidden="true" />
                Looking for 10 more people… {elapsed}s
              </p>
            )}

            {view === 'pending' &&
              pendingCount === 0 &&
              batch.state !== 'running' && (
                <div className="fn-everyone">
                  {batch.state === 'empty' ? (
                    <>
                      <p className="ui-sub">No new people for that description yet.</p>
                      {batch.suggestions.length > 0 && (
                        <>
                          <p className="ui-hint">Try one of these instead:</p>
                          <div className="fn-suggestions">
                            {batch.suggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                className="fn-suggestion"
                                onClick={() => openRefine(splitSuggestion(suggestion))}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : batch.state === 'failed' ? (
                    <>
                      <p className="ui-sub">{batch.error}</p>
                      <button
                        type="button"
                        className="ui-btn"
                        onClick={() => setBatch({ state: 'idle', error: '', suggestions: [] })}
                      >
                        Back to your list
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="ui-sub">That’s everyone for now.</p>
                      <button
                        type="button"
                        className="ui-btn ui-btn-primary"
                        onClick={() => startRun(null)}
                      >
                        Show 10 more like these
                      </button>
                    </>
                  )}
                </div>
              )}

            {view !== 'pending' && rows.length === 0 && (
              <p className="ui-sub fn-quiet">
                {view === 'kept' ? 'Nobody kept yet.' : 'Nobody skipped yet.'}
              </p>
            )}

            {account && <AutopilotCard account={account} onToggle={handleAutopilotToggle} />}
          </>
        )}
      </main>

      {toast && (
        <div role="status" className="ui-toast fn-toast">
          <span>{toast.message}</span>
          {toast.action && (
            <button type="button" className="ui-link" onClick={() => toast.action.onClick()}>
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
