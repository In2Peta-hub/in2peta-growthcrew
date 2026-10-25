import { getModule } from './features.js';

// Explicit origins support a custom domain pair. Vercel preview hosts stay on
// one origin until both domains have been configured for the deployment.
export function routeHosts(href = window.location.href) {
  const current = new URL(href);
  const local = /^(app\.)?localhost$/.test(current.hostname) || current.hostname === '127.0.0.1';
  const site = new URL(import.meta.env?.VITE_SITE_URL || current.origin);
  if (!import.meta.env?.VITE_SITE_URL) {
    site.hostname = local ? 'localhost' : current.hostname.replace(/^app\./, '');
  }
  const app = new URL(import.meta.env?.VITE_APP_URL || site.origin);
  if (!import.meta.env?.VITE_APP_URL && (local || !site.hostname.endsWith('.vercel.app'))) {
    app.hostname = `app.${site.hostname}`;
  }
  return { site: site.origin, app: app.origin, prefix: site.origin === app.origin ? '/app' : '' };
}

export function viewPath(view) {
  if (view === 'workspace') return '/';
  if (view === 'review') return '/leads';
  if (view === 'social') return '/social';
  if (view === 'login') return '/login';
  if (view.startsWith('soon:') && getModule(view.slice(5))) return `/${view.slice(5)}`;
  return '/';
}

export function viewUrl(view, href = window.location.href) {
  const hosts = routeHosts(href);
  return view === 'landing' ? `${hosts.site}/` : `${hosts.app}${hosts.prefix}${viewPath(view)}`;
}

export function readRoute(href = window.location.href) {
  const url = new URL(href);
  const hosts = routeHosts(href);
  const appHost = url.origin === hosts.app && (hosts.prefix ? url.pathname.startsWith(`${hosts.prefix}/`) || url.pathname === hosts.prefix : true);
  const path = (hosts.prefix && appHost ? url.pathname.slice(hosts.prefix.length) : url.pathname).replace(/\/$/, '') || '/';
  // Accept old links on the public host and canonicalize them on startup.
  if (path === '/leads') return 'review';
  if (path === '/social' || url.searchParams.has('oauth_success') || url.searchParams.has('oauth_error')) return 'social';
  if (path === '/login') return 'login';
  if (path === '/workspace') return 'workspace';
  const module = getModule(path.slice(1));
  if (module?.status === 'soon') return `soon:${module.id}`;
  return appHost ? 'workspace' : 'landing';
}
