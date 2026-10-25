import { apiFetch } from './api';

const SESSION = 'gc_finder_session';

// Transfer only a short-lived, single-use code. The actual session token stays
// in the API response and local storage, never in navigation URLs.
export async function navigateAcrossHosts(target, replace = false) {
  const session = JSON.parse(localStorage.getItem(SESSION) || 'null');
  const fragment = new URLSearchParams();
  if (session?.token) {
    if (localStorage.getItem('gc_finder_mock') === '1' || import.meta.env.VITE_FINDER_MOCK === '1') {
      fragment.set('gc_demo', '1');
    } else {
      const { code } = await apiFetch('/api/finder/session-handoffs', {
        method: 'POST',
        headers: { 'X-Finder-Token': session.token },
        body: JSON.stringify({ origin: target.origin }),
      });
      fragment.set('gc_handoff', code);
    }
  } else {
    fragment.set('gc_signed_out', '1');
  }
  if (localStorage.getItem('gc_finder_autopilot_off') === '1') fragment.set('gc_autopilot_off', '1');
  target.hash = fragment.toString();
  window.location[replace ? 'replace' : 'assign'](target.href);
}

export async function receiveSessionHandoff() {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  if (!['gc_handoff', 'gc_signed_out', 'gc_demo'].some(key => fragment.has(key))) return;
  // Remove the one-use code before rendering the app or redeeming the code.
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  if (fragment.get('gc_autopilot_off') === '1') localStorage.setItem('gc_finder_autopilot_off', '1');
  localStorage.removeItem(SESSION);
  localStorage.removeItem('gc_finder_mock');
  if (fragment.get('gc_demo') === '1') {
    localStorage.setItem('gc_finder_mock', '1');
    localStorage.setItem(SESSION, JSON.stringify({ email: 'demo@example.com', token: 'mock-token' }));
  } else if (fragment.has('gc_handoff')) {
    const { account, token } = await apiFetch('/api/finder/session-handoffs/consume', {
      method: 'POST', body: JSON.stringify({ code: fragment.get('gc_handoff') }),
    });
    localStorage.setItem(SESSION, JSON.stringify({ email: account.email, token }));
  }
}
