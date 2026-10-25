import React from 'react';
import { ArrowLeft, ArrowRight, Check, Clock3, Sparkles } from 'lucide-react';
import { LIVE_MODULES, getModule } from '../features';
import { ModuleIcon } from './ModuleIcon';
import WorkspaceHeader from './WorkspaceHeader';
import WorkspaceNav from './WorkspaceNav';
import './workspace.css';

export default function ComingSoon({
  moduleId,
  session,
  onNavigate,
  onBackToSite,
  onSignOut,
}) {
  const module = getModule(moduleId);

  if (!module) {
    return (
      <div className="ws-app">
        <WorkspaceHeader email={session?.email} onHome={() => onNavigate('workspace')} onBackToSite={onBackToSite} onSignOut={onSignOut} />
        <WorkspaceNav active="workspace" onNavigate={onNavigate} />
        <main className="ws-main ws-soon-main">
          <div className="ws-soon-panel">
            <h1>That page is not here</h1>
            <p>The workspace has changed since this link was made.</p>
            <button type="button" className="ui-btn ui-btn-primary" onClick={() => onNavigate('workspace')}>
              Back to the workspace
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="ws-app">
      <WorkspaceHeader
        email={session?.email}
        onHome={() => onNavigate('workspace')}
        onBackToSite={onBackToSite}
        onSignOut={onSignOut}
      />
      <WorkspaceNav active={module.id} onNavigate={onNavigate} />

      <main className="ws-main ws-soon-main">
        <button type="button" className="ws-back" onClick={() => onNavigate('workspace')}>
          <ArrowLeft size={15} aria-hidden="true" /> Workspace
        </button>

        <section className={`ws-soon-hero ws-soon-${module.color}`}>
          <div className="ws-soon-copy">
            <span className="ws-status is-soon"><Clock3 size={12} aria-hidden="true" /> Coming soon</span>
            <span className="ws-soon-icon"><ModuleIcon id={module.id} size={28} /></span>
            <h1>{module.name} is on the way.</h1>
            <p>{module.summary}</p>
            <div className="ws-hero-actions">
              <button type="button" className="ui-btn ui-btn-primary ui-btn-lg" onClick={() => onNavigate('leads')}>
                Use Lead Gen now <ArrowRight size={17} aria-hidden="true" />
              </button>
              <button type="button" className="ui-btn ui-btn-lg" onClick={() => onNavigate('social')}>
                Open Social Studio
              </button>
            </div>
          </div>

          <aside className="ws-soon-card" aria-label={`What ${module.name} will do`}>
            <span className="ws-today-label">Planned for this agent</span>
            <ul>
              {module.capabilities.map((item) => (
                <li key={item}><Check size={15} aria-hidden="true" />{item}</li>
              ))}
            </ul>
            <p className="ws-soon-note">
              It is not available to use yet. We are not going to show a button that does nothing or pretend
              it is ready before it is.
            </p>
          </aside>
        </section>

        <section className="ws-soon-today" aria-labelledby="ws-soon-today-title">
          <div>
            <span className="ws-section-eyebrow">Meanwhile</span>
            <h2 id="ws-soon-today-title">What you can use today</h2>
            <p>Two agents are live and connected to the same account.</p>
          </div>
          <div className="ws-soon-links">
            {LIVE_MODULES.map((live) => (
              <button key={live.id} type="button" className="ws-soon-link" onClick={() => onNavigate(live.id)}>
                <span className={`ws-card-icon ws-card-${live.color}`}><ModuleIcon id={live.id} size={19} /></span>
                <span>
                  <b>{live.name}</b>
                  <small>{live.tagline}</small>
                </span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        <section className="ws-soon-roadmap">
          <Sparkles size={16} aria-hidden="true" />
          <p>
            The roadmap order is SEO, then influencers and paid ads, then the shared report. Each new agent
            appears in this workspace — no second login, no separate tool to learn.
          </p>
          <button type="button" className="ui-link" onClick={() => onNavigate('workspace')}>See the whole workspace</button>
        </section>
      </main>

      <footer className="ws-footer">
        <span>GrowthCrew, a product by In2Peta</span>
        <button type="button" className="ui-link" onClick={onBackToSite}>Back to the site</button>
      </footer>
    </div>
  );
}
