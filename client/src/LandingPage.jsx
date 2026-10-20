import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import DescribeBox from './finder/DescribeBox';
import PreviewList from './finder/PreviewList';
import SaveStep from './finder/SaveStep';
import { getPreview, getSession, pollUntilSettled, startPreview } from './finder/finderApi';
import './LandingPage.css';

const YEAR = new Date().getFullYear();

const LogoMark = () => (
  <span className="gc-logo-mark" aria-hidden="true">
    <img src="/brand/in2peta-logo.png" alt="" width="36" height="36" decoding="async" />
  </span>
);

/* Real shopfronts on one Pune street, from open collections. They show
   the kind of business Lead Gen finds; none of them is a customer. */
const STREET = [
  {
    src: '/street/hind-saree-centre.jpg', w: 1024, h: 768,
    place: 'Hind Saree Centre', where: 'Saree shop',
    alt: 'The green neon sign of Hind Saree Centre lit above its shopfront at dusk',
    credit: 'shankar s.', license: 'CC BY 2.0', page: 'https://www.flickr.com/photos/77742560@N06/7637741130'
  },
  {
    src: '/street/sai-prasad-251-laxmi-road-pune.jpg', w: 1600, h: 1200,
    place: 'Sai Prasad', where: '251 Laxmi Road',
    alt: 'A white corner building with a sweet shop on its ground floor',
    credit: 'DesiBoy101', license: 'CC BY 4.0', page: 'https://commons.wikimedia.org/w/index.php?curid=193596094'
  },
  {
    src: '/street/jai-hind-cloth-store-pune-poona.jpg', w: 1024, h: 768,
    place: 'Jai Hind', where: 'Clothing store',
    alt: 'A clothing store with lit glass floors and signs, evening traffic in front',
    credit: 'shankar s.', license: 'CC BY 2.0', page: 'https://www.flickr.com/photos/77742560@N06/7637740294'
  },
  {
    src: '/street/569-laxmi-road-pune.jpg', w: 1600, h: 1200,
    place: 'Jewellers and a tailor', where: '569 Laxmi Road',
    alt: 'An old three-storey building with shop signs, a festival crowd in the street below',
    credit: 'DesiBoy101', license: 'CC BY 4.0', page: 'https://commons.wikimedia.org/w/index.php?curid=193596050'
  }
];

const STREET_WIDE = {
  src: '/street/laxmi-road-in-pune-illuminated-during-diwali.jpg', w: 1600, h: 1200,
  alt: 'Laxmi Road at night during Diwali, strings of lights over the shops',
  credit: 'DesiBoy101', license: 'CC BY 4.0',
  page: 'https://commons.wikimedia.org/w/index.php?curid=166121132'
};

const LEAD_STOPS = [
  { title: 'Found', note: 'Matches the trade and place you described.', status: 'New' },
  { title: 'Kept', note: 'You choose who belongs on your list.', status: 'Kept' },
  { title: 'First message', note: 'Copy a personal first message into your own Gmail.', status: 'Message ready' },
  { title: 'Every Monday', note: 'Turn it on and 10 more people arrive each week.', status: 'Weekly' },
];

const COMPARISON = [
  ['Find people', 'Describe them in one sentence', 'Filters and spreadsheets'],
  ['Choose who fits', 'Keep or skip each person', 'Clean a long list by hand'],
  ['First message', 'Written for each person you keep', 'One template for everyone'],
  ['Send it', 'Copy it or open it in your Gmail', 'Move between tools'],
  ['Next week', '10 more every Monday, if you turn it on', 'Start over'],
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
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [rootRef]);
};

export default function LandingPage({ onLoginClick, onSignedIn, onOpenList }) {
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

  useReveal(rootRef);

  useEffect(() => {
    if (status !== 'running') return undefined;
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

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

  return (
    <div className="gc-landing" ref={rootRef}>
      <a className="gc-skip" href="#gc-main">Skip to content</a>
      <header className="gc-header">
        <button type="button" className="gc-logo" onClick={focusHero} aria-label="GrowthCrew: back to top">
          <LogoMark />
          <span className="gc-logo-word">GrowthCrew</span>
        </button>
        <nav className="gc-nav" aria-label="Primary">
          <a className="gc-nav-link" href="#gc-how">How it works</a>
          {signedIn ? (
            <button type="button" className="gc-btn gc-btn-light" onClick={onOpenList}>Your list</button>
          ) : (
            <button type="button" className="gc-nav-link" onClick={onLoginClick}>Sign in</button>
          )}
        </nav>
      </header>

      <main id="gc-main">
        <section className="gc-hero" aria-labelledby={`${idBase}-hero`}>
          <div className="gc-hero-copy">
            <h1 className="gc-h1 gc-lines" id={`${idBase}-hero`}>
              <span className="gc-line"><span style={{ '--i': 0 }}>Who should you</span></span>
              <span className="gc-line"><span style={{ '--i': 1 }}>talk to next?</span></span>
            </h1>
            <p className="gc-hero-sub gc-load" style={{ '--i': 2 }}>
              Describe the people you want to meet. See up to five good matches before you sign up.
            </p>
            <div className="gc-hero-form gc-load" style={{ '--i': 3 }}>
              <DescribeBox
                key={formKey}
                initialDescribe={query}
                busy={status === 'running'}
                onSubmit={runSearch}
              />
            </div>
          </div>
          <div className="gc-results-stage">
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
            {status === 'idle' && (
              <div className="gc-result-intro gc-load-ui" data-ui>
                <p>Try a plain description</p>
                <ul>
                  {['dentists in Austin', 'SaaS founders in Austin', 'independent cafés near Bristol'].map((example) => (
                    <li key={example}>
                      <button type="button" className="gc-example" onClick={() => rerun(example)}>{example}</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section className="gc-street" aria-labelledby={`${idBase}-street`}>
          <div className="gc-street-copy">
            <h2 className="gc-h2" id={`${idBase}-street`} data-reveal>Every shopfront has someone</h2>
            <p className="gc-lead" data-reveal style={{ '--i': 1 }}>
              Name a trade and a place. GrowthCrew searches its business records and the web for people who fit.
            </p>
          </div>
          <figure className="gc-street-wide" data-reveal>
            <div className="gc-street-wide-frame">
              <img src={STREET_WIDE.src} width={STREET_WIDE.w} height={STREET_WIDE.h} alt={STREET_WIDE.alt} loading="lazy" decoding="async" />
            </div>
            <figcaption className="gc-credit">
              Laxmi Road, Pune, at Diwali. Photo: <a href={STREET_WIDE.page} target="_blank" rel="noreferrer">{STREET_WIDE.credit}</a>, {STREET_WIDE.license}
            </figcaption>
          </figure>
          <ul className="gc-shops" aria-label="Shops on Laxmi Road, Pune">
            {STREET.map((shop, i) => (
              <li key={shop.src} className="gc-shop" data-reveal style={{ '--i': i }}>
                <div className="gc-shop-frame">
                  <img src={shop.src} width={shop.w} height={shop.h} alt={shop.alt} loading="lazy" decoding="async" />
                </div>
                <p className="gc-shop-name">{shop.place}</p>
                <p className="gc-credit">
                  {shop.where}, Pune. Photo: <a href={shop.page} target="_blank" rel="noreferrer">{shop.credit}</a>, {shop.license}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="gc-strip" id="gc-how" aria-labelledby={`${idBase}-how`}>
          {LEAD_STOPS.map((stop, i) => (
            <div className={`gc-field gc-field-${i}`} key={stop.title} data-reveal style={{ '--i': i }}>
              {i === 0 && <h2 className="gc-strip-title" id={`${idBase}-how`}>One person, four stops</h2>}
              <article className="gc-card" data-ui aria-label={`Lead card: ${stop.status}`}>
                <div className="gc-card-top">
                  <span className="gc-card-name">Smile Craft Dental</span>
                  <span className="gc-card-status">{stop.status}</span>
                </div>
                <p className="gc-card-meta">Dental clinic · Kothrud, Pune</p>
                <p className="gc-card-row">{stop.note}</p>
              </article>
              <p className="gc-clause">{stop.title}</p>
            </div>
          ))}
        </section>

        <section className="gc-compare" id="gc-compare" aria-labelledby={`${idBase}-compare`}>
          <h2 className="gc-h2 gc-compare-title" id={`${idBase}-compare`} data-reveal>A shorter way to a useful list</h2>
          <div className="gc-table" role="table" aria-labelledby={`${idBase}-compare`} data-reveal>
            <div className="gc-tr gc-th" role="row">
              <span role="columnheader" className="gc-sr">Job</span>
              <span role="columnheader" className="gc-td gc-td-feature">In GrowthCrew</span>
              <span role="columnheader" className="gc-td">The usual way</span>
            </div>
            {COMPARISON.map(([job, ours, theirs], i) => (
              <div className="gc-tr" role="row" key={job} style={{ '--i': i }}>
                <span role="rowheader" className="gc-td-job">{job}</span>
                <span role="cell" className="gc-td gc-td-feature">{ours}</span>
                <span role="cell" className="gc-td gc-td-usual">
                  <span className="gc-only-sm">The usual way:{' '}</span>{theirs}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="gc-final" aria-labelledby={`${idBase}-final`}>
          <div className="gc-final-copy">
            <h2 className="gc-final-title gc-lines" id={`${idBase}-final`} data-reveal>
              <span className="gc-line"><span>Start with</span></span>
              <span className="gc-line"><span>one sentence.</span></span>
            </h2>
            <p className="gc-lead" data-reveal>
              You'll see who matches before we ask for your email.
            </p>
          </div>
          <button type="button" className="gc-btn gc-btn-light gc-btn-lg gc-final-button" data-reveal onClick={focusHero}>
            Find people <ArrowRight size={18} aria-hidden="true" />
          </button>
        </section>
      </main>

      <footer className="gc-footer">
        <p>GrowthCrew, a product by In2Peta · &copy; {YEAR}</p>
        <nav className="gc-footer-nav" aria-label="Footer">
          <a href="#gc-how">How it works</a>
          {signedIn
            ? <button type="button" onClick={onOpenList}>Your list</button>
            : <button type="button" onClick={onLoginClick}>Sign in</button>}
        </nav>
      </footer>
    </div>
  );
}
