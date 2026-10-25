import React, { useEffect, useId, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Layers,
  Menu,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
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

const STEPS = [
  {
    title: 'Describe who you want',
    body: 'One sentence and, if you like, your website. No filters, no boolean strings, no spreadsheet to clean.',
    tag: 'About a minute',
  },
  {
    title: 'We read it like a brief',
    body: 'GrowthCrew works out the trade, the place and the intent, then searches business records and live listings.',
    tag: 'Real records',
  },
  {
    title: 'See up to five matches',
    body: 'Each person comes with a reason they fit. You see them before we ask for an email address.',
    tag: 'No card',
  },
  {
    title: 'Keep or skip each one',
    body: 'You make one decision per person. Nothing is saved to your list unless you keep it.',
    tag: 'You decide',
  },
  {
    title: 'Get a first message',
    body: 'Every kept lead gets a short, personal first message you can copy into your own Gmail.',
    tag: 'Written for them',
  },
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

function Ticker() {
  const [paused, setPaused] = useState(false);
  const items = MODULES.map((module) => ({
    id: module.id,
    label: module.name,
    copy:
      module.id === 'leads'
        ? 'finds people who match a plain-English brief'
        : module.id === 'social'
          ? 'writes, previews, schedules and publishes'
          : module.id === 'seo'
            ? 'audits, writes and ships safe fixes'
            : module.id === 'influencer'
              ? 'finds, checks and briefs creators'
              : module.id === 'ads'
                ? 'plans, tests and reallocates spend'
                : 'reports every agent back in one place',
    live: module.status === 'live',
  }));

  return (
    <div className={`gcl-ticker${paused ? ' is-paused' : ''}`} aria-label="What each agent does">
      <div className="gcl-ticker-track">
        {[0, 1].map((copyIndex) => (
          <div className="gcl-ticker-group" aria-hidden={copyIndex === 1} key={copyIndex}>
            {items.map((item) => (
              <span className="gcl-ticker-item" key={`${copyIndex}-${item.id}`}>
                <ModuleIcon id={item.id} size={16} />
                <b>{item.label}</b>
                {item.copy}
                <em>{item.live ? 'Live' : 'Soon'}</em>
              </span>
            ))}
          </div>
        ))}
      </div>
      <button
        type="button"
        className="gcl-ticker-pause"
        onClick={() => setPaused((value) => !value)}
        aria-pressed={paused}
        aria-label={paused ? 'Resume the agent ticker' : 'Pause the agent ticker'}
      >
        {paused ? <Play size={11} aria-hidden="true" /> : <Pause size={11} aria-hidden="true" />}
        {paused ? 'Play' : 'Pause'}
      </button>
    </div>
  );
}

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
      <p className="gcl-agent-summary">{module.summary}</p>
      <ul className="gcl-agent-list">
        {module.capabilities.map((capability) => (
          <li key={capability}>
            <Check size={14} aria-hidden="true" />
            {capability}
          </li>
        ))}
      </ul>
      <button type="button" className="gcl-agent-link" onClick={() => onNavigate(module.id)}>
        {live ? `Open ${module.name}` : 'See what is planned'}
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
                  <Sparkles size={16} aria-hidden="true" /> Try a search
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
              <p className="gcl-eyebrow" data-reveal>
                <span className="gcl-pulse" aria-hidden="true" />
                AI growth team · 5 agents · 1 shared brief
              </p>
              <h1 id={`${idBase}-hero`} data-reveal style={{ '--i': 1 }}>
                The growth team you <span className="gcl-grad">could never afford</span>.
              </h1>
              <p className="gcl-lede" data-reveal style={{ '--i': 2 }}>
                GrowthCrew gives founder-led businesses five AI agents on one shared context:
                lead generation, social, SEO, influencers and paid ads. <b>Two are working in your
                workspace today.</b> The other three are being built in the open.
              </p>

              <div className="gcl-hero-ctas" data-reveal style={{ '--i': 3 }}>
                <button type="button" className="gcl-btn gcl-btn-primary gcl-btn-lg" onClick={goToConsole}>
                  <Sparkles size={17} aria-hidden="true" /> Find your first ten leads
                </button>
                <a className="gcl-btn gcl-btn-ghost gcl-btn-lg" href="#report">
                  <Play size={15} aria-hidden="true" /> See an example report
                </a>
              </div>

              <ul className="gcl-trust" data-reveal style={{ '--i': 4 }}>
                {['Up to five matches before sign-up', 'Real business records', 'You approve every message', 'No card to start'].map((item) => (
                  <li key={item}><Check size={13} aria-hidden="true" /> {item}</li>
                ))}
              </ul>
            </div>

            <div className="gcl-hero-console" data-reveal style={{ '--i': 1 }}>
              <div className="gcl-console">
                <div className="gcl-console-bar">
                  <span className="gcl-window-dots" aria-hidden="true"><i /><i /><i /></span>
                  <span className="gcl-console-title">growthcrew / find-people</span>
                  <span className={`gcl-console-status${status === 'running' ? ' is-running' : ''}`}>
                    <i aria-hidden="true" />
                    {status === 'running' ? 'searching real records' : 'live search'}
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
                      <p className="gcl-console-empty-title">Type one sentence. See who fits.</p>
                      <p className="gcl-console-empty-copy">
                        No filters, no long form. We search business records and live listings, then
                        show up to five people with the reason each one matches.
                      </p>
                      <div className="gcl-samples" aria-label="Example searches">
                        <span>Try:</span>
                        {SAMPLE_SEARCHES.map((sample) => (
                          <button key={sample} type="button" className="gcl-sample" onClick={() => rerun(sample)}>
                            {sample}
                          </button>
                        ))}
                      </div>
                      <div className="gcl-console-hints">
                        <span><Check size={12} aria-hidden="true" /> No card</span>
                        <span><ShieldCheck size={12} aria-hidden="true" /> Nothing sent without you</span>
                        <span><Clock3 size={12} aria-hidden="true" /> Usually under a minute</span>
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

                <div className="gcl-console-foot">
                  <span><ShieldCheck size={13} aria-hidden="true" /> Real search, real records — not a mock-up</span>
                  <span>Lead Gen · live</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="gcl-state-strip" aria-label="What is live">
          <div className="gcl-wrap gcl-state-grid">
            <div className="gcl-state-copy">
              <p className="gcl-eyebrow"><Layers size={14} aria-hidden="true" /> One brief, one workspace</p>
              <p>
                Every agent reads the same context: your offer, your buyer, your proof and your
                budget. That is how five specialists disagree less than five separate tools.
              </p>
            </div>
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

        <Ticker />

        <section className="gcl-section" id="how" aria-labelledby={`${idBase}-how`}>
          <div className="gcl-wrap">
            <div className="gcl-section-head is-center" data-reveal>
              <p className="gcl-eyebrow">How it works</p>
              <h2 id={`${idBase}-how`}>One sentence in. A list worth acting on out.</h2>
              <p>
                The working half of GrowthCrew is deliberately small: describe the people you want,
                see the matches, decide who belongs, and leave with a first message. No new CRM to
                learn.
              </p>
            </div>

            <div className="gcl-flow" data-reveal>
              {STEPS.map((step, index) => (
                <article className="gcl-flow-step" key={step.title}>
                  <span className="gcl-flow-num">{String(index + 1).padStart(2, '0')}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  <span className="gcl-flow-tag">{step.tag}</span>
                </article>
              ))}
            </div>

            <p className="gcl-flow-foot" data-reveal>
              <Sparkles size={14} aria-hidden="true" />
              The SEO, Influencers and Paid ads agents will follow the same brief — and you will
              approve anything that spends money.
            </p>
          </div>
        </section>

        <section className="gcl-section gcl-report-section" id="report" aria-labelledby={`${idBase}-report`}>
          <div className="gcl-wrap">
            <div className="gcl-section-head is-center" data-reveal>
              <p className="gcl-eyebrow is-amber">Example report · sample business</p>
              <h2 id={`${idBase}-report`}>Here is what the full team will hand back.</h2>
              <p>
                A diagnosis, a ranked list of fixes, a dollar allocation with the reasoning shown,
                and a 30-day projection. Everything below is sample data for a fictional business —
                it shows the shape of the output, not a customer result.
              </p>
            </div>
            <div data-reveal>
              <DemoReport initialKey="gym" />
            </div>
            <div className="gcl-report-foot" data-reveal>
              <p>
                <b>The top of this page is the real product.</b> The report is the destination for
                the three agents still in build.
              </p>
              <button type="button" className="gcl-btn gcl-btn-ghost" onClick={goToConsole}>
                Run a real lead search <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        <section className="gcl-section" id="compare" aria-labelledby={`${idBase}-compare`}>
          <div className="gcl-wrap">
            <div className="gcl-section-head is-center" data-reveal>
              <p className="gcl-eyebrow">Compared with hiring</p>
              <h2 id={`${idBase}-compare`}>A shorter way to a useful list.</h2>
              <p>
                Not a claim that two live agents replace a whole marketing department. A claim that
                the first, most repetitive job — finding people and starting the conversation — can
                be much smaller than it is today.
              </p>
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
                <p className="gcl-eyebrow is-mint">Early access</p>
                <div className="gcl-cost-main">
                  <b>Free</b>
                  <span>to start, no card</span>
                </div>
                <p>
                  Lead Gen and Social Studio are free while they are in early access. There is no
                  pricing promise for the agents that have not shipped.
                </p>
                <ul>
                  <li><Check size={14} aria-hidden="true" /> Five lead matches before sign-up</li>
                  <li><Check size={14} aria-hidden="true" /> Keep or skip every person</li>
                  <li><Check size={14} aria-hidden="true" /> A first message for each kept lead</li>
                  <li><Check size={14} aria-hidden="true" /> 10 more every Monday, if you opt in</li>
                </ul>
                <button type="button" className="gcl-btn gcl-btn-light gcl-btn-block" onClick={goToConsole}>
                  Start with one sentence <ArrowRight size={15} aria-hidden="true" />
                </button>
                <p className="gcl-cost-fineprint">
                  When SEO, Influencers, Paid ads and Reports ship, their price will be published
                  first. Ad spend and creator fees will be billed at cost.
                </p>
              </aside>
            </div>
          </div>
        </section>

        <section className="gcl-section" id="faq" aria-labelledby={`${idBase}-faq`}>
          <div className="gcl-wrap gcl-faq-wrap">
            <div className="gcl-section-head" data-reveal>
              <p className="gcl-eyebrow">Questions</p>
              <h2 id={`${idBase}-faq`}>The honest answers.</h2>
              <p>
                What is live, what is not, and what happens to your list. If something is missing,
                ask and we will add it.
              </p>
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
              <p className="gcl-eyebrow">The agent team</p>
              <h2 id={`${idBase}-agents`}>Two live. Three in build. One shared brief.</h2>
              <p>
                Each agent gets its own playbook and its own measure. The roadmap is public because
                you should know exactly what you are signing up for.
              </p>
            </div>

            <div className="gcl-agent-grid">
              {MODULES.slice(0, 5).map((module) => (
                <AgentCard key={module.id} module={module} onNavigate={navigate} />
              ))}

              <article className="gcl-agent gcl-agent-wide">
                <div className="gcl-agent-wide-copy">
                  <div className="gcl-agent-top">
                    <span className="gcl-agent-icon"><Layers size={21} aria-hidden="true" /></span>
                    <StatusBadge live={false} />
                  </div>
                  <h3>One context. One budget. One dashboard.</h3>
                  <p className="gcl-agent-summary">
                    Reports is the sixth view: what every agent did, what it cost, and what it
                    brought back. It stays on the roadmap until there is more than one live agent
                    spending money.
                  </p>
                  <ul className="gcl-agent-list">
                    <li><Check size={14} aria-hidden="true" /> One approval queue for anything that spends money</li>
                    <li><Check size={14} aria-hidden="true" /> Shared cost per customer across every channel</li>
                    <li><Check size={14} aria-hidden="true" /> A short weekly note, not a forty-slide deck</li>
                  </ul>
                  <button type="button" className="gcl-agent-link" onClick={() => navigate('reports')}>
                    See what is planned <ArrowRight size={15} aria-hidden="true" />
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
                  <p className="gcl-agent-note">
                    <b>Sample report —</b> numbers are illustrative. This view has no live data until
                    the paid agents ship.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="gcl-cta-section" aria-labelledby={`${idBase}-cta`}>
          <div className="gcl-wrap">
            <div className="gcl-cta" data-reveal>
              <p className="gcl-eyebrow is-mint">Free early access · no card</p>
              <h2 id={`${idBase}-cta`}>Find out who you should talk to next.</h2>
              <p>
                Type one sentence. See up to five matches before we ask for your email. Keep the
                people who fit, and leave with a first message for each one.
              </p>
              <div className="gcl-hero-ctas is-centered">
                <button type="button" className="gcl-btn gcl-btn-primary gcl-btn-lg" onClick={goToConsole}>
                  <Sparkles size={17} aria-hidden="true" /> Find people
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
              <p>The growth team for businesses that cannot afford one yet. Built one working agent at a time.</p>
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
            <span>GrowthCrew, a product by In2Peta · &copy; {YEAR}</span>
            <span>Sample data is labelled. Nothing on this page promises a result.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
