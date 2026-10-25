import React, { useEffect, useId, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleCheckBig,
  Clock3,
  Contact,
  FileSearch,
  Mail,
  Menu,
  Search,
  TextCursorInput,
  X,
} from 'lucide-react';
import DescribeBox from './finder/DescribeBox';
import PreviewList from './finder/PreviewList';
import SaveStep from './finder/SaveStep';
import { getPreview, getSession, pollUntilSettled, startPreview } from './finder/finderApi';
import { LIVE_MODULES, MODULES, SOON_MODULES } from './features';
import { ModuleIcon } from './marketing/ModuleIcon';
import DemoReport from './marketing/DemoReport';
import './LandingPage.css';

const YEAR = new Date().getFullYear();

const SAMPLE_SEARCHES = ['dentists in Austin', 'SaaS founders in Austin', 'independent cafés near Bristol'];

// Icons name the action in each step: type, read, review, decide, send.
const STEPS = [
  { icon: TextCursorInput, title: 'Describe who you want', body: 'One sentence and your URL. No filters or spreadsheets.' },
  { icon: FileSearch, title: 'We read it like a brief', body: 'We pull out the trade, place and intent, then search live listings.' },
  { icon: Contact, title: 'See up to five matches', body: 'Each with a reason it fits, before you give an email.' },
  { icon: CircleCheckBig, title: 'Keep or skip each one', body: 'One decision per lead. Only the ones you keep are saved.' },
  { icon: Mail, title: 'Get a first message', body: 'A short, personal intro to copy into your Gmail.' },
];

const COMPARISON = [
  ['Find people', 'Describe them in one sentence', 'Buy a list, then filter it by hand'],
  ['Choose who fits', 'Keep or skip each person', 'Clean a long spreadsheet'],
  ['First message', 'Written for each person you keep', 'One template for everyone'],
  ['Send it', 'Copy it or open it in your Gmail', 'Move between three tools'],
  ['Next week', '10 more every Monday, if you turn it on', 'Start the whole search again'],
];

const FAQ = [
  {
    q: 'What works today?',
    a: 'Two agents are live. Lead Gen searches real business records from a plain-English description, shows up to five matches before sign-up, and writes a first message for each person you keep. Social Studio writes captions with AI, previews them in each network’s native format, then schedules or publishes to the channels you connect.',
  },
  {
    q: 'What is not live yet?',
    a: 'SEO, Influencers, Paid ads and Reports. They are on the roadmap and shown in the workspace as coming soon. The example report on this page shows the shape of their output using a fictional business — it is sample data, clearly labelled, not a customer result.',
  },
  {
    q: 'Can the agents spend money without asking?',
    a: 'No agent can spend money today. When the paid agents ship, anything that costs money — ads, creator fees, paid tools — will sit in an approval queue with the amount, the reasoning and the expected result. A cap you set will stop anything above it.',
  },
  {
    q: 'Do I need to be technical?',
    a: 'No. You type a sentence and paste a URL if you have one. Everything after that — the search, the list, the message — is handled in plain language. You mostly say yes or no.',
  },
  {
    q: 'Who owns the accounts and content?',
    a: 'You do. Lead Gen works with your own list and your own Gmail. Social Studio publishes to channels you connect. Nothing is locked inside GrowthCrew, and you can export your list as CSV.',
  },
  {
    q: 'Is the report on this page real?',
    a: 'No. It is a complete example for three fictional businesses, built to show the layout, the reasoning and the level of detail. The numbers are illustrative, not a promise of results. The lead search at the top is the real, working product.',
  },
  {
    q: 'What does it cost?',
    a: 'Lead Gen and Social Studio are free during early access, and no card is needed to try the first search. Pricing for the other agents will be published before they ship — not before. Ad spend and creator fees, when those agents arrive, will be billed at cost.',
  },
];

const useReveal = (rootRef) => {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const targets = root.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('is-in'));
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [rootRef]);
};

const Logo = () => (
  <img
    className="gcl-logo-img"
    src="/brand/in2peta-logo.png"
    alt=""
    width="34"
    height="34"
    decoding="async"
  />
);

const StatusBadge = ({ live }) => (
  <span className={`gcl-badge ${live ? 'is-live' : 'is-soon'}`}>
    {live ? <Check size={12} aria-hidden="true" /> : <Clock3 size={12} aria-hidden="true" />}
    {live ? 'Live' : 'Coming soon'}
  </span>
);

function AgentCard({ module, onNavigate }) {
  const live = module.status === 'live';
  return (
    <article className={`gcl-agent gcl-agent-${module.color}${live ? ' is-live' : ''}`}>
      <div className="gcl-agent-top">
        <span className="gcl-agent-icon"><ModuleIcon id={module.id} size={21} /></span>
        <StatusBadge live={live} />
      </div>
      <h3>{module.name}</h3>
      <p className="gcl-agent-tagline">{module.tagline}</p>
      <ul className="gcl-agent-list">
        {module.capabilities.map((capability) => (
          <li key={capability}>
            <Check size={14} aria-hidden="true" />
            {capability}
          </li>
        ))}
      </ul>
      <button type="button" className="gcl-agent-link" onClick={() => onNavigate(module.id)}>
        {live ? `Open ${module.name}` : 'See the plan'}
        <ArrowRight size={15} aria-hidden="true" />
      </button>
    </article>
  );
}

export default function LandingPage({ onLoginClick, onSignedIn, onNavigate }) {
  const signedIn = Boolean(getSession());
  const rootRef = useRef(null);
  const requestRef = useRef(0);
  const idBase = useId();
  const [query, setQuery] = useState('');
  const [formKey, setFormKey] = useState(0);
  const [status, setStatus] = useState('idle');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useReveal(rootRef);

  useEffect(() => {
    if (status !== 'running') return undefined;
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  const runSearch = async (describe, website = '') => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setQuery(describe);
    setPreview(null);
    setError('');
    setElapsed(0);
    setStatus('running');

    try {
      const started = await startPreview(describe, website);
      if (requestRef.current !== requestId) return;
      const initial = { ...started, understood: null, leads: [], suggestions: [] };
      setPreview(initial);
      const settled = await pollUntilSettled(
        () => getPreview(started.previewId),
        (update) => {
          if (requestRef.current === requestId) setPreview(update);
        },
      );
      if (!settled || requestRef.current !== requestId) return;
      setPreview(settled);
      setStatus(settled.status);
      if (settled.status === 'failed') setError(settled.error || 'The search stopped before it finished.');
    } catch (searchError) {
      if (requestRef.current !== requestId) return;
      setError(searchError?.message || 'The search could not start.');
      setStatus(searchError?.status === 429 ? 'rate-limited' : 'failed');
    }
  };

  const rerun = (nextQuery) => {
    setQuery(nextQuery);
    setFormKey((value) => value + 1);
    runSearch(nextQuery);
  };

  const focusHero = () => {
    rootRef.current?.querySelector('[data-hero-input]')?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToConsole = () => {
    rootRef.current?.querySelector('.gcl-console')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(focusHero, 450);
  };

  const navigate = (id) => {
    setMenuOpen(false);
    onNavigate?.(id);
  };

  const navItems = [
    ['#how', 'How it works'],
    ['#report', 'Example report'],
    ['#agents', 'The agents'],
    ['#compare', 'Compared with hiring'],
    ['#faq', 'FAQ'],
  ];

  return (
    <div className="gcl-root" ref={rootRef}>
      <a className="gcl-skip" href="#gcl-main">Skip to content</a>

      <header className={`gcl-header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="gcl-header-in">
          <button type="button" className="gcl-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="GrowthCrew: back to top">
            <Logo />
            <span>GrowthCrew</span>
          </button>

          <nav className="gcl-nav" aria-label="Primary">
            {navItems.map(([href, label]) => (
              <a key={href} href={href}>{label}</a>
            ))}
          </nav>

          <div className="gcl-header-actions">
            {signedIn ? (
              <button type="button" className="gcl-btn gcl-btn-light" onClick={() => navigate('workspace')}>
                Open workspace <ArrowRight size={16} aria-hidden="true" />
              </button>
            ) : (
              <>
                <button type="button" className="gcl-btn gcl-btn-ghost" onClick={onLoginClick}>Sign in</button>
                <button type="button" className="gcl-btn gcl-btn-primary" onClick={goToConsole}>
                  <Search size={16} aria-hidden="true" /> Try a search
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            className="gcl-menu-button"
            aria-expanded={menuOpen}
            aria-controls={`${idBase}-menu`}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>

        {menuOpen && (
          <nav className="gcl-mobile-nav" id={`${idBase}-menu`} aria-label="Mobile">
            {navItems.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
            {signedIn ? (
              <button type="button" className="gcl-btn gcl-btn-light" onClick={() => navigate('workspace')}>
                Open workspace <ArrowRight size={16} aria-hidden="true" />
              </button>
            ) : (
              <button type="button" className="gcl-btn gcl-btn-primary" onClick={() => { setMenuOpen(false); onLoginClick(); }}>
                Sign in
              </button>
            )}
          </nav>
        )}
      </header>

      <main id="gcl-main">
        <section className="gcl-hero" aria-labelledby={`${idBase}-hero`}>
          <div className="gcl-wrap gcl-hero-grid">
            <div className="gcl-hero-copy">
              <h1 id={`${idBase}-hero`} data-reveal style={{ '--i': 1 }}>
                The growth team you could never afford.
              </h1>
              <p className="gcl-lede" data-reveal style={{ '--i': 2 }}>
                Five AI agents for founder-led businesses, working from one brief. Lead Gen and
                Social Studio are ready today.
              </p>

              <div className="gcl-hero-ctas" data-reveal style={{ '--i': 3 }}>
                <button type="button" className="gcl-btn gcl-btn-primary gcl-btn-lg" onClick={goToConsole}>
                  Find your first leads <ArrowRight size={17} aria-hidden="true" />
                </button>
                <a className="gcl-btn gcl-btn-ghost gcl-btn-lg" href="#report">
                  See an example report <ArrowDown size={16} aria-hidden="true" />
                </a>
              </div>

              <ul className="gcl-trust" data-reveal style={{ '--i': 4 }}>
                {['Five matches before sign-up', 'You approve every message', 'No card needed'].map((item) => (
                  <li key={item}><Check size={13} aria-hidden="true" /> {item}</li>
                ))}
              </ul>
            </div>

            <div className="gcl-hero-console" data-reveal style={{ '--i': 1 }}>
              <div className="gcl-console">
                <div className="gcl-console-bar">
                  <span className="gcl-window-dots" aria-hidden="true"><i /><i /><i /></span>
                  <span className="gcl-console-title">Find people</span>
                  <span className={`gcl-console-status${status === 'running' ? ' is-running' : ''}`}>
                    <i aria-hidden="true" />
                    {status === 'running' ? 'Searching' : 'Live search'}
                  </span>
                </div>

                <div className="gcl-console-body">
                  <DescribeBox
                    key={formKey}
                    initialDescribe={query}
                    busy={status === 'running'}
                    onSubmit={runSearch}
                  />

                  {status === 'idle' ? (
                    <div className="gcl-console-empty">
                      <div className="gcl-samples" aria-label="Example searches">
                        <span>Try:</span>
                        {SAMPLE_SEARCHES.map((sample) => (
                          <button key={sample} type="button" className="gcl-sample" onClick={() => rerun(sample)}>
                            {sample}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <PreviewList
                        preview={preview}
                        status={status}
                        error={error}
                        elapsed={elapsed}
                        onRetry={() => runSearch(query)}
                        onSuggestion={rerun}
                      />
                      {status === 'done' && preview?.leads?.length > 0 && (
                        <SaveStep preview={preview} onSignedIn={onSignedIn} />
                      )}
                      {status !== 'running' && (
                        <button type="button" className="gcl-console-reset" onClick={() => { setStatus('idle'); setPreview(null); setQuery(''); setFormKey((value) => value + 1); }}>
                          Start a different search
                        </button>
                      )}
                    </>
                  )}
                </div>

              </div>
            </div>
          </div>
        </section>

        <section className="gcl-state-strip" aria-label="What is live">
          <div className="gcl-wrap gcl-state-grid">
            <div className="gcl-state-live">
              <span className="gcl-state-label">Live now</span>
              {LIVE_MODULES.map((module) => (
                <button type="button" key={module.id} className="gcl-state-module" onClick={() => navigate(module.id)}>
                  <ModuleIcon id={module.id} size={15} /> {module.name} <ArrowUpRight size={13} aria-hidden="true" />
                </button>
              ))}
            </div>
            <div className="gcl-state-soon">
              <span className="gcl-state-label">In build</span>
              {SOON_MODULES.map((module) => (
                <button type="button" key={module.id} className="gcl-state-module is-soon" onClick={() => navigate(module.id)}>
                  <ModuleIcon id={module.id} size={14} /> {module.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="gcl-section" id="how" aria-labelledby={`${idBase}-how`}>
          <div className="gcl-wrap">
            <div className="gcl-section-head is-center" data-reveal>
              <h2 id={`${idBase}-how`}>One sentence in. A list worth acting on out.</h2>
            </div>

            <div className="gcl-flow" data-reveal>
              {STEPS.map(({ icon: Icon, title, body }) => (
                <article className="gcl-flow-step" key={title}>
                  <Icon className="gcl-flow-icon" size={30} strokeWidth={1.5} aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="gcl-section gcl-report-section" id="report" aria-labelledby={`${idBase}-report`}>
          <div className="gcl-wrap">
            <div className="gcl-section-head is-center" data-reveal>
              <h2 id={`${idBase}-report`}>What the full team will hand back.</h2>
              <p>Sample data for a fictional business, so you can see the shape of the output.</p>
            </div>
            <div data-reveal>
              <DemoReport initialKey="gym" />
            </div>
            <div className="gcl-report-foot" data-reveal>
              <p>The lead search at the top of this page is the real product.</p>
              <button type="button" className="gcl-btn gcl-btn-ghost" onClick={goToConsole}>
                Run a real lead search <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        <section className="gcl-section" id="compare" aria-labelledby={`${idBase}-compare`}>
          <div className="gcl-wrap">
            <div className="gcl-section-head is-center" data-reveal>
              <h2 id={`${idBase}-compare`}>A shorter way to a useful list.</h2>
            </div>

            <div className="gcl-compare" data-reveal>
              <div className="gcl-table" role="table" aria-label="GrowthCrew compared with doing it by hand">
                <div className="gcl-tr gcl-th" role="row">
                  <span role="columnheader">Job</span>
                  <span role="columnheader">In GrowthCrew</span>
                  <span role="columnheader">The usual way</span>
                </div>
                {COMPARISON.map(([job, ours, theirs]) => (
                  <div className="gcl-tr" role="row" key={job}>
                    <span role="rowheader">{job}</span>
                    <span role="cell" className="is-ours">{ours}</span>
                    <span role="cell" className="is-theirs">{theirs}</span>
                  </div>
                ))}
              </div>

              <aside className="gcl-cost-card">
                <div className="gcl-cost-main">
                  <b>Free</b>
                  <span>during early access</span>
                </div>
                <ul>
                  <li><Check size={14} aria-hidden="true" /> Five lead matches before sign-up</li>
                  <li><Check size={14} aria-hidden="true" /> Keep or skip every person</li>
                  <li><Check size={14} aria-hidden="true" /> A first message for each kept lead</li>
                  <li><Check size={14} aria-hidden="true" /> 10 more every Monday, if you opt in</li>
                </ul>
                <button type="button" className="gcl-btn gcl-btn-light gcl-btn-block" onClick={goToConsole}>
                  Start with one sentence <ArrowRight size={15} aria-hidden="true" />
                </button>
              </aside>
            </div>
          </div>
        </section>

        <section className="gcl-section" id="faq" aria-labelledby={`${idBase}-faq`}>
          <div className="gcl-wrap gcl-faq-wrap">
            <div className="gcl-section-head" data-reveal>
              <h2 id={`${idBase}-faq`}>The honest answers.</h2>
            </div>
            <div className="gcl-faq" data-reveal>
              {FAQ.map((item, index) => (
                <details key={item.q} open={index === 0}>
                  <summary>{item.q}</summary>
                  <div className="gcl-faq-answer">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="gcl-section" id="agents" aria-labelledby={`${idBase}-agents`}>
          <div className="gcl-wrap">
            <div className="gcl-section-head" data-reveal>
              <h2 id={`${idBase}-agents`}>Two live. Three in build. One shared brief.</h2>
            </div>

            <div className="gcl-agent-grid">
              {MODULES.slice(0, 5).map((module) => (
                <AgentCard key={module.id} module={module} onNavigate={navigate} />
              ))}

              <article className="gcl-agent gcl-agent-wide">
                <div className="gcl-agent-wide-copy">
                  <div className="gcl-agent-top">
                    <span className="gcl-agent-icon"><ModuleIcon id="reports" size={21} /></span>
                    <StatusBadge live={false} />
                  </div>
                  <h3>Reports</h3>
                  <p className="gcl-agent-tagline">What every agent did, what it cost, what it brought back</p>
                  <ul className="gcl-agent-list">
                    <li><Check size={14} aria-hidden="true" /> One approval queue for anything that spends money</li>
                    <li><Check size={14} aria-hidden="true" /> Shared cost per customer across every channel</li>
                    <li><Check size={14} aria-hidden="true" /> A short weekly note, not a forty-slide deck</li>
                  </ul>
                  <button type="button" className="gcl-agent-link" onClick={() => navigate('reports')}>
                    See the plan <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
                <div className="gcl-agent-preview" aria-hidden="true">
                  <p>This week at a glance</p>
                  <div className="gcl-agent-stats">
                    <span><b>$300</b><small>Budget deployed</small></span>
                    <span><b>83</b><small>New customers</small></span>
                    <span><b>$2.54</b><small>Blended CAC</small></span>
                    <span><b>14.2h</b><small>Your time saved</small></span>
                  </div>
                  <p className="gcl-agent-note">Sample numbers</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="gcl-cta-section" aria-labelledby={`${idBase}-cta`}>
          <div className="gcl-wrap">
            <div className="gcl-cta" data-reveal>
              <h2 id={`${idBase}-cta`}>Find out who to talk to next.</h2>
              <p>Five matches before sign-up. No card.</p>
              <div className="gcl-hero-ctas is-centered">
                <button type="button" className="gcl-btn gcl-btn-primary gcl-btn-lg" onClick={goToConsole}>
                  <Search size={17} aria-hidden="true" /> Find people
                </button>
                <a className="gcl-btn gcl-btn-ghost gcl-btn-lg" href="#agents">Meet the agents</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="gcl-footer">
        <div className="gcl-wrap">
          <div className="gcl-footer-grid">
            <div className="gcl-footer-brand">
              <span className="gcl-brand"><Logo /> <span>GrowthCrew</span></span>
              <p>The growth team for businesses that cannot afford one yet.</p>
            </div>
            <div className="gcl-footer-col">
              <h3>Product</h3>
              <a href="#how">How it works</a>
              <a href="#report">Example report</a>
              <a href="#agents">The agents</a>
              <a href="#compare">Compared with hiring</a>
            </div>
            <div className="gcl-footer-col">
              <h3>Live today</h3>
              <button type="button" onClick={() => navigate('leads')}>Lead Gen</button>
              <button type="button" onClick={() => navigate('social')}>Social Studio</button>
              <a href="#faq">What is not live</a>
            </div>
            <div className="gcl-footer-col">
              <h3>Company</h3>
              <a href="#faq">FAQ</a>
              <a href="https://www.in2peta.com" target="_blank" rel="noreferrer">In2Peta</a>
              {signedIn
                ? <button type="button" onClick={() => navigate('workspace')}>Open workspace</button>
                : <button type="button" onClick={onLoginClick}>Sign in</button>}
            </div>
          </div>
          <div className="gcl-footer-bottom">
            <span>GrowthCrew by In2Peta · &copy; {YEAR}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
