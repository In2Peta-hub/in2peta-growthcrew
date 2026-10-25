import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Loader2, RefreshCw, Users } from 'lucide-react';
import { LIVE_MODULES, SOON_MODULES } from '../features';
import { listLeads, me } from '../finder/finderApi';
import { ModuleIcon } from './ModuleIcon';
import WorkspaceHeader from './WorkspaceHeader';
import WorkspaceNav from './WorkspaceNav';
import './workspace.css';

const firstName = (email = '') => {
  const local = email.split('@')[0] || 'there';
  return local.charAt(0).toUpperCase() + local.slice(1);
};

const liveNote = (id, counts) => {
  if (id === 'leads') {
    if (!counts) return 'Your list, preview and weekly email';
    if (counts.pending > 0) return `${counts.pending} ${counts.pending === 1 ? 'person' : 'people'} waiting for a decision`;
    if (counts.kept > 0) return `${counts.kept} kept · find ten more like them`;
    return 'Start with one sentence';
  }
  return 'Captions, previews and a review queue';
};

function ModuleCard({ module, onOpen, counts }) {
  const live = module.status === 'live';
  return (
    <button
      type="button"
      className={`ws-card ws-card-${module.color}${live ? ' is-live' : ' is-soon'}`}
      onClick={() => onOpen(module.id)}
    >
      <div className="ws-card-top">
        <span className="ws-card-icon"><ModuleIcon id={module.id} size={21} /></span>
      </div>
      <h3>{module.name}</h3>
      <p>{module.tagline}</p>
      {live && <span className="ws-card-note">{liveNote(module.id, counts)}</span>}
      <span className="ws-card-action">
        {live ? (module.id === 'leads' ? 'Open your list' : 'Open Social Studio') : 'See the plan'}
        <ArrowRight size={15} aria-hidden="true" />
      </span>
    </button>
  );
}

export default function WorkspaceHome({
  session,
  onNavigate,
  onBackToSite,
  onSignOut,
  onSessionExpired,
}) {
  const [account, setAccount] = useState(null);
  const [leads, setLeads] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  // The parent passes a fresh callback each render; read it through a ref so
  // a re-render never refetches the workspace.
  const expired = useRef(onSessionExpired);
  useEffect(() => {
    expired.current = onSessionExpired;
  });

  const reload = () => {
    setStatus('loading');
    setError('');
    setReloadKey((value) => value + 1);
  };

  useEffect(() => {
    let alive = true;

    Promise.allSettled([me(), listLeads('all')]).then(([accountResult, leadsResult]) => {
      if (!alive) return;
      const authFailure = [accountResult, leadsResult].find(
        (result) => result.status === 'rejected' && result.reason?.status === 401,
      );
      if (authFailure) {
        expired.current();
        return;
      }
      if (accountResult.status === 'fulfilled') setAccount(accountResult.value.account);
      if (leadsResult.status === 'fulfilled') setLeads(leadsResult.value.leads || []);
      if (accountResult.status === 'rejected' || leadsResult.status === 'rejected') {
        setError('Some of your workspace data could not be loaded. Your account is still signed in.');
        setStatus('partial');
        return;
      }
      setStatus('ready');
    });

    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const counts = useMemo(() => {
    if (account?.counts) {
      return {
        pending: account.counts.pending ?? 0,
        kept: account.counts.kept ?? 0,
        skipped: account.counts.skipped ?? 0,
      };
    }
    return leads.reduce(
      (acc, lead) => ({ ...acc, [lead.status]: (acc[lead.status] || 0) + 1 }),
      { pending: 0, kept: 0, skipped: 0 },
    );
  }, [account, leads]);

  const pending = counts.pending;
  const recent = leads.filter((lead) => lead.status === 'pending').slice(0, 3);
  const displayCounts = status === 'loading' ? null : counts;

  const open = (id) => {
    if (id === 'workspace') return;
    onNavigate(id);
  };

  return (
    <div className="ws-app">
      <WorkspaceHeader
        email={session?.email}
        onHome={() => onNavigate('workspace')}
        onBackToSite={onBackToSite}
        onSignOut={onSignOut}
      />
      <WorkspaceNav active="workspace" onNavigate={onNavigate} />

      <main className="ws-main">
        <section className="ws-hero">
          <div className="ws-hero-copy">
            <h1>Welcome back, {firstName(session?.email)}.</h1>
            <p>Start with the people you want to talk to, then write the posts that keep you in front of them.</p>
            <div className="ws-hero-actions">
              <button type="button" className="ui-btn ui-btn-primary ui-btn-lg" onClick={() => open('leads')}>
                {pending > 0 ? `Review ${pending} ${pending === 1 ? 'person' : 'people'}` : 'Find people to talk to'}
                <ArrowRight size={17} aria-hidden="true" />
              </button>
              <button type="button" className="ui-btn ui-btn-lg" onClick={() => open('social')}>
                Open Social Studio
              </button>
            </div>
          </div>

          <aside className="ws-today" aria-label="Today">
            <div className="ws-today-top">
              <span>Today</span>
              {status === 'loading' ? (
                <Loader2 size={15} className="ui-spin" aria-label="Loading" />
              ) : (
                <button type="button" className="ws-refresh" onClick={reload} aria-label="Refresh workspace data">
                  <RefreshCw size={14} aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="ws-stats">
              <div>
                <b>{displayCounts ? displayCounts.pending : '—'}</b>
                <span>To review</span>
              </div>
              <div>
                <b>{displayCounts ? displayCounts.kept : '—'}</b>
                <span>Kept</span>
              </div>
              <div>
                <b>{displayCounts ? displayCounts.skipped : '—'}</b>
                <span>Skipped</span>
              </div>
            </div>

            <div className="ws-today-list">
              <p className="ws-today-label">Next up</p>
              {recent.length > 0 ? (
                <ul>
                  {recent.map((lead) => (
                    <li key={lead.key}>
                      <span className="ws-lead-dot" aria-hidden="true" />
                      <div>
                        <b>{lead.name || lead.company}</b>
                        <span>{[lead.role, lead.company, lead.city].filter(Boolean).join(' · ')}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="ws-today-empty">
                  <Users size={18} aria-hidden="true" />
                  <p>
                    {pending === 0 && counts.kept > 0
                      ? 'No one is waiting. Find ten more like the people you kept.'
                      : 'Describe who you want to meet and see up to five matches.'}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p className="ws-inline-error" role="status">
                {error}{' '}
                <button type="button" className="ui-link" onClick={reload}>
                  Try again
                </button>
              </p>
            )}

            <button type="button" className="ws-today-action" onClick={() => open('leads')}>
              {pending > 0 ? 'Keep or skip them' : 'Open your list'}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </aside>
        </section>

        <section className="ws-section" aria-labelledby="ws-live-title">
          <div className="ws-section-head">
            <h2 id="ws-live-title">Ready to use</h2>
          </div>
          <div className="ws-grid ws-grid-live">
            {LIVE_MODULES.map((module) => (
              <ModuleCard key={module.id} module={module} onOpen={open} counts={displayCounts} />
            ))}
          </div>
        </section>

        <section className="ws-section" aria-labelledby="ws-soon-title">
          <div className="ws-section-head">
            <h2 id="ws-soon-title">Coming soon</h2>
          </div>
          <div className="ws-grid ws-grid-soon">
            {SOON_MODULES.map((module) => (
              <ModuleCard key={module.id} module={module} onOpen={open} counts={displayCounts} />
            ))}
          </div>
        </section>

      </main>

      <footer className="ws-footer">
        <span>GrowthCrew by In2Peta</span>
        <button type="button" className="ui-link" onClick={onBackToSite}>Back to the site</button>
      </footer>
    </div>
  );
}
