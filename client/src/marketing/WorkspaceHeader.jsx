import React from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';

export default function WorkspaceHeader({ email, onHome, onBackToSite, onSignOut }) {
  return (
    <header className="ws-header">
      <div className="ws-header-in">
        <button type="button" className="ws-brand" onClick={onHome} aria-label="GrowthCrew workspace home">
          <img className="ws-brand-logo" src="/brand/in2peta-logo.png" alt="" width="36" height="36" />
          <span className="ws-brand-word">GrowthCrew</span>
          <span className="ws-brand-tag">Workspace</span>
        </button>
        <div className="ws-header-actions">
          <span className="ws-header-mail">{email}</span>
          <button type="button" className="ui-btn ui-btn-ghost ui-btn-sm" onClick={onBackToSite}>
            <ArrowLeft aria-hidden="true" /> Site
          </button>
          <button type="button" className="ui-btn ui-btn-ghost ui-btn-sm" onClick={onSignOut}>
            <LogOut aria-hidden="true" /> Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
