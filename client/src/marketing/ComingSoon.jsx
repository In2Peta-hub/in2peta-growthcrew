import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { getModule } from '../features';
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
        <section className={`ws-soon-hero ws-soon-${module.color}`}>
          <div className="ws-soon-copy">
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
            <span className="ws-today-label">What it will do</span>
            <ul>
              {module.capabilities.map((item) => (
                <li key={item}><Check size={15} aria-hidden="true" />{item}</li>
              ))}
            </ul>
          </aside>
        </section>
      </main>

      <footer className="ws-footer">
        <span>GrowthCrew by In2Peta</span>
        <button type="button" className="ui-link" onClick={onBackToSite}>Back to the site</button>
      </footer>
    </div>
  );
}
