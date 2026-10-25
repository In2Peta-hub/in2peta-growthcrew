import React from 'react';
import { WORKSPACE_NAV } from '../features';
import { ModuleIcon } from './ModuleIcon';
import './workspaceNav.css';

// One thin module switcher shared by the lead list, Social Studio and the
// workspace home. It is the map of the product: two modules live, the rest
// clearly labelled as coming soon so a click never becomes a dead end.
// `width` and `pad` match the host screen's header so the edges line up.
export default function WorkspaceNav({ active, onNavigate, sticky = true, width, pad }) {
  if (!onNavigate) return null;

  const shell = {
    ...(width && { '--ws-shell-width': width }),
    ...(pad && { '--ws-shell-pad': pad }),
  };

  return (
    <nav className={`ws-switcher${sticky ? '' : ' is-static'}`} style={shell} aria-label="GrowthCrew workspace">
      <div className="ws-switcher-in">
        {WORKSPACE_NAV.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`ws-switcher-item${isActive ? ' is-active' : ''}${item.status === 'soon' ? ' is-soon' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
            >
              <ModuleIcon id={item.id} size={16} />
              <span>{item.name}</span>
              {item.status === 'soon' && <span className="ws-switcher-soon">Soon</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
