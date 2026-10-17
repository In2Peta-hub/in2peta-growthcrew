import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import './LandingPage.css';
import { Menu, X, LogOut, ArrowRight, ArrowUpRight } from 'lucide-react';

/* Brand channel glyphs — the app draws these inline in App.jsx too
   (lucide dropped brand icons), matching the same 24px stroke style. */
const InstagramGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const LinkedInGlyph = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37h2.79V10.9H6.46M7.86 6.54a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0 3.26z" />
  </svg>
);

const XGlyph = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const CHANNELS = [
  { id: 'instagram', name: 'Instagram', Icon: InstagramGlyph, limit: 2200 },
  { id: 'facebook', name: 'Facebook', Icon: FacebookGlyph, limit: 63206 },
  { id: 'linkedin', name: 'LinkedIn', Icon: LinkedInGlyph, limit: 3000 },
  { id: 'x', name: 'X', Icon: XGlyph, limit: 280 }
];

const YEAR = new Date().getFullYear();

/* The supplied In2Peta logo on a white tile so the violet bulb stays
   legible on the dark ground. */
const LogoMark = ({ size = 36 }) => (
  <span className="gc-logo-mark" aria-hidden="true">
    <img src="/brand/in2peta-logo.png" alt="" width={size} height={size} decoding="async" />
  </span>
);

/* ── The composer fragment's drafting rules ─────────────────────────────
   A local stand-in for the studio's AI so the hero works without an
   account: it reshapes the visitor's line into a post and a cold email.
   The sample lead is example data and is labelled as such on the page. */
const DEFAULT_LINE = 'We build fast websites for dental clinics';
const SAMPLE_LEAD = { name: 'Smile Craft Dental', area: 'Kothrud, Pune', trade: 'Dental clinic' };
const STOPWORDS = new Set(
  'about after also and are back been best both but can for from get have help into just make more most much our over same some such than that the their them then they this those very want what when with your yours ours'.split(' ')
);

const tidy = (line) => line.trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, '');
const lowerFirst = (s) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
const upperFirst = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/* "We build websites" stays a sentence; "websites for clinics" becomes "We do websites…". */
const asWeSentence = (line) => {
  const t = tidy(line);
  if (!t) return '';
  if (/^(we|i|our|my)\b/i.test(t)) return upperFirst(t);
  return `We do ${lowerFirst(t)}`;
};

const hashtagsFor = (line) => {
  const seen = new Set();
  return tidy(line)
    .split(/[^A-Za-z0-9]+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w.toLowerCase()))
    .filter((w) => {
      const k = w.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 3)
    .map((w) => `#${upperFirst(w.toLowerCase())}`);
};

const draftPost = (line) => {
  const sentence = asWeSentence(line);
  if (!sentence) return { caption: '', tags: [] };
  return {
    caption: `${sentence}. If that is what your week needs, send us a message and we will take it from there.`,
    tags: hashtagsFor(line)
  };
};

const draftEmail = (line) => {
  const sentence = asWeSentence(line);
  if (!sentence) return { subject: '', body: '' };
  return {
    subject: `A quick idea for ${SAMPLE_LEAD.name}`,
    body: `Hi there, I came across ${SAMPLE_LEAD.name} while looking at clinics in ${SAMPLE_LEAD.area.split(',')[0]}. ${sentence}, and I think a short call could be worth your time. Would Thursday suit you?`
  };
};

/* Words arrive one after another, the way the studio streams a draft.
   Keyed by the text so every new draft replays; capped so long drafts
   never take more than ~0.6s to settle. */
const Streamed = ({ text }) => {
  const words = text.split(' ');
  const step = Math.min(22, 600 / Math.max(words.length, 1));
  return (
    <span className="gc-stream" key={text}>
      {words.map((w, i) => (
        <span key={i} style={{ '--d': `${Math.round(i * step)}ms` }}>
          {w}{' '}
        </span>
      ))}
    </span>
  );
};

/* A two-option switch built from real radios, so arrows and labels work
   natively; the thumb slides under the checked option. */
const Segmented = ({ name, value, options, onChange, className = '', label }) => {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div
      className={`gc-seg ${className}`}
      role="radiogroup"
      aria-label={label}
      style={{ '--seg-i': index, '--seg-n': options.length }}
    >
      <span className="gc-seg-thumb" aria-hidden="true" />
      {options.map((o) => (
        <label key={o.value} className="gc-seg-opt" data-on={o.value === value || undefined}>
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={o.value === value}
            onChange={() => onChange(o.value)}
          />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
};

/* Scroll entrances: anything with data-reveal gets .is-in once, when it
   first crosses into view. Content stays visible without script because
   the hidden state only applies under html.js (set in index.html). */
const useReveal = (rootRef) => {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const targets = root.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-in'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [rootRef]);
};

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

/* One lead, four stops: the same card further along in each field. */
const LEAD_STOPS = [
  { clause: ['First, it’s found', 'by trade and place.'], status: 'New lead', stage: 0 },
  { clause: ['Then it gets', 'its own email.'], status: 'Drafted', stage: 1 },
  { clause: ['Then it goes out', 'once you approve it.'], status: 'Sent', stage: 2 },
  { clause: ['Then they', 'write back.'], status: 'Replied', stage: 3 }
];

const COMPARISON = [
  ['Write the caption', 'An AI draft in your brand voice', 'A blank document'],
  ['See it per channel', 'Instagram, Facebook, LinkedIn and X previews', 'Post it, then check each app'],
  ['Sign it off', 'An approval queue before anything goes live', 'A thread of screenshots'],
  ['Publish it', 'Now, or in the slot you pick', 'One app per channel'],
  ['Keep the media', 'One library for images and video', 'Somebody’s downloads folder'],
  ['Find businesses', 'Search by industry and location', 'Maps, one tab at a time'],
  ['Write to them', 'A personal first email for each lead', 'One template for everyone'],
  ['Hear back', 'Each reply logged on its lead and sent on to your inbox', 'Search your inbox and hope']
];

export default function LandingPage({ onNavigate, onLoginClick, currentUser, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  /* The hero composer and the closing dialog share the visitor's line. */
  const [line, setLine] = useState(DEFAULT_LINE);
  const [output, setOutput] = useState('post');
  const [channel, setChannel] = useState('instagram');
  const [settledLine, setSettledLine] = useState(DEFAULT_LINE);
  const [timing, setTiming] = useState('now');
  const [start, setStart] = useState('social');

  const rootRef = useRef(null);
  const profileRef = useRef(null);
  const burgerRef = useRef(null);
  const idBase = useId();

  useReveal(rootRef);

  /* Redraft a beat after typing stops, so words don't stream on every key. */
  useEffect(() => {
    const t = setTimeout(() => setSettledLine(line), 380);
    return () => clearTimeout(t);
  }, [line]);

  const post = useMemo(() => draftPost(settledLine), [settledLine]);
  const email = useMemo(() => draftEmail(settledLine), [settledLine]);
  const activeChannel = CHANNELS.find((c) => c.id === channel) || CHANNELS[0];
  const postLength = (post.caption + (post.tags.length ? ` ${post.tags.join(' ')}` : '')).length;
  const emailWords = email.body ? email.body.split(/\s+/).length : 0;

  const userName = currentUser?.name || currentUser?.email || '';
  const userInitial = currentUser?.initial || (userName ? userName[0].toUpperCase() : 'G');

  /* Escape closes the profile menu and the mobile drawer, refocusing the trigger. */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (profileOpen) {
        setProfileOpen(false);
        profileRef.current?.querySelector('button')?.focus();
      }
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
        burgerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [profileOpen, mobileMenuOpen]);

  /* Click outside closes the profile menu. */
  useEffect(() => {
    if (!profileOpen) return undefined;
    const onPointerDown = (e) => {
      if (!profileRef.current?.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [profileOpen]);

  const go = (target) => onNavigate(target);

  return (
    <div className="gc-landing" ref={rootRef}>
      <a className="gc-skip" href="#gc-main">Skip to content</a>

      {/* ───────────────────────── NAV ───────────────────────── */}
      <header className="gc-header">
        <button
          type="button"
          className="gc-logo"
          onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
          aria-label="GrowthCrew: back to top"
        >
          <LogoMark />
          <span className="gc-logo-word">GrowthCrew</span>
        </button>

        <nav className="gc-nav" aria-label="Primary">
          <button type="button" className="gc-nav-link" onClick={() => go('social')}>Social Studio</button>
          <button type="button" className="gc-nav-link" onClick={() => go('leadgen')}>Lead Gen</button>
          <a className="gc-nav-link" href="#gc-how">How it works</a>
          <a className="gc-nav-link" href="#gc-compare">Compare</a>
        </nav>

        <div className="gc-header-actions">
          {currentUser ? (
            <div className="gc-profile" ref={profileRef}>
              <button
                type="button"
                className="gc-avatar"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-label={`Account menu for ${userName}`}
                onClick={() => setProfileOpen((open) => !open)}
              >
                {userInitial}
              </button>
              {profileOpen && (
                <div className="gc-menu" role="menu" aria-label="Account">
                  <div className="gc-menu-head">
                    <span className="gc-menu-name">{userName}</span>
                    {currentUser?.email && <span className="gc-menu-mail">{currentUser.email}</span>}
                  </div>
                  <button type="button" role="menuitem" className="gc-menu-item" onClick={() => { setProfileOpen(false); go('social'); }}>
                    <ArrowUpRight size={16} aria-hidden="true" />
                    Open Social Studio
                  </button>
                  <button type="button" role="menuitem" className="gc-menu-item gc-menu-danger" onClick={() => { setProfileOpen(false); onLogout?.(); }}>
                    <LogOut size={16} aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button type="button" className="gc-nav-link gc-hide-sm" onClick={onLoginClick}>Log in</button>
              <button type="button" className="gc-btn gc-btn-light" onClick={onLoginClick}>Sign up</button>
            </>
          )}
          <button
            ref={burgerRef}
            type="button"
            className="gc-burger"
            aria-expanded={mobileMenuOpen}
            aria-controls="gc-mobile-menu"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="gc-mobile" id="gc-mobile-menu">
            <nav aria-label="Primary mobile">
              <button type="button" className="gc-mobile-link" onClick={() => { setMobileMenuOpen(false); go('social'); }}>Social Studio</button>
              <button type="button" className="gc-mobile-link" onClick={() => { setMobileMenuOpen(false); go('leadgen'); }}>Lead Generation</button>
              <a className="gc-mobile-link" href="#gc-how" onClick={() => setMobileMenuOpen(false)}>How it works</a>
              <a className="gc-mobile-link" href="#gc-compare" onClick={() => setMobileMenuOpen(false)}>Compare</a>
            </nav>
            <div className="gc-mobile-actions">
              {currentUser ? (
                <button type="button" className="gc-btn gc-btn-dark gc-btn-block" onClick={() => { setMobileMenuOpen(false); onLogout?.(); }}>
                  Sign out of {userName}
                </button>
              ) : (
                <button type="button" className="gc-btn gc-btn-light gc-btn-block" onClick={() => { setMobileMenuOpen(false); onLoginClick(); }}>
                  Log in or get started
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <main id="gc-main">
        {/* ───────────────────────── HERO: the composer at work ───────────────────────── */}
        <section className="gc-hero" aria-labelledby={`${idBase}-hero`}>
          <div className="gc-hero-copy">
            <h1 className="gc-h1 gc-lines" id={`${idBase}-hero`}>
              <span className="gc-line"><span style={{ '--i': 0 }}>Posts and pipeline,</span></span>
              <span className="gc-line"><span style={{ '--i': 1 }}>from one line.</span></span>
            </h1>
            <p className="gc-hero-sub gc-load" style={{ '--i': 2 }}>
              Say what your business does. GrowthCrew turns it into posts for your channels
              and personal emails to the businesses you want as customers.
            </p>
            <div className="gc-hero-actions gc-load" style={{ '--i': 3 }}>
              {currentUser ? (
                <>
                  <button type="button" className="gc-btn gc-btn-accent gc-btn-lg" onClick={() => go('social')}>
                    Open Social Studio <ArrowRight size={18} aria-hidden="true" />
                  </button>
                  <button type="button" className="gc-btn gc-btn-text" onClick={() => go('leadgen')}>
                    Find leads <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </>
              ) : (
                <button type="button" className="gc-btn gc-btn-accent gc-btn-lg" onClick={onLoginClick}>
                  Open your workspace <ArrowRight size={18} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <div className="gc-hero-stage">
            <div className="gc-composer gc-load-ui" data-ui>
              <label className="gc-ui-label" htmlFor={`${idBase}-line`}>What does your business do?</label>
              <input
                id={`${idBase}-line`}
                className="gc-ui-input"
                value={line}
                maxLength={90}
                spellCheck="false"
                onChange={(e) => setLine(e.target.value)}
                placeholder={DEFAULT_LINE}
              />

              <Segmented
                name={`${idBase}-out`}
                label="Draft as"
                value={output}
                onChange={setOutput}
                options={[
                  { value: 'post', label: 'Social post' },
                  { value: 'email', label: 'Cold email' }
                ]}
              />

              <div className="gc-ui-out" aria-live="polite">
                {output === 'post' ? (
                  <div className="gc-ui-pane" key="post">
                    <div className="gc-ui-channels" role="group" aria-label="Preview channel">
                      {CHANNELS.map(({ id, name, Icon }) => (
                        <button
                          key={id}
                          type="button"
                          className="gc-ui-channel"
                          aria-pressed={channel === id}
                          aria-label={name}
                          title={name}
                          onClick={() => setChannel(id)}
                        >
                          <Icon />
                        </button>
                      ))}
                      <span className="gc-ui-chan-name">{activeChannel.name}</span>
                    </div>
                    <p className="gc-ui-text">
                      {post.caption ? <Streamed text={post.caption} /> : <span className="gc-ui-dim">Type a line above.</span>}
                    </p>
                    {post.tags.length > 0 && <p className="gc-ui-tags">{post.tags.join(' ')}</p>}
                    <p className="gc-ui-readout">
                      {postLength} characters
                      {postLength > activeChannel.limit
                        ? ` · ${postLength - activeChannel.limit} over the ${activeChannel.name} limit`
                        : ` · fits ${activeChannel.name}`}
                    </p>
                  </div>
                ) : (
                  <div className="gc-ui-pane" key="email">
                    <p className="gc-ui-lead">
                      <span className="gc-ui-lead-name">{SAMPLE_LEAD.name}</span>
                      <span className="gc-ui-dim">{SAMPLE_LEAD.trade} · {SAMPLE_LEAD.area}</span>
                    </p>
                    <p className="gc-ui-subject">{email.subject || 'Subject'}</p>
                    <p className="gc-ui-text">
                      {email.body ? <Streamed text={email.body} /> : <span className="gc-ui-dim">Type a line above.</span>}
                    </p>
                    <p className="gc-ui-readout">{emailWords} words · reads in about {Math.max(5, Math.round(emailWords / 4))} seconds</p>
                  </div>
                )}
              </div>

              <div className="gc-ui-foot">
                <span className="gc-ui-note">Example draft. Sign in for the AI version.</span>
                <button
                  type="button"
                  className="gc-ui-btn"
                  onClick={() => go(output === 'post' ? 'social' : 'leadgen')}
                >
                  {output === 'post' ? 'Open in Social Studio' : 'Open in Lead Gen'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────────────── SHOWCASE: one control, blown up ───────────────────────── */}
        <section className="gc-show" data-timing={timing} aria-labelledby={`${idBase}-show`}>
          <div className="gc-show-copy" data-reveal>
            <h2 className="gc-h2" id={`${idBase}-show`}>
              Post it{' '}
              <span className="gc-swap" key={timing}>{timing === 'now' ? 'now.' : 'Friday.'}</span>
            </h2>
            <p className="gc-lead">
              {timing === 'now'
                ? 'Approve it and it goes to every connected channel at once.'
                : 'Or pick a slot. The post waits in the queue and leaves on time.'}
            </p>
          </div>
          <div className="gc-show-control" data-ui data-reveal>
            <Segmented
              name={`${idBase}-timing`}
              label="When to publish"
              className="gc-seg-poster"
              value={timing}
              onChange={setTiming}
              options={[
                { value: 'now', label: 'Publish now' },
                { value: 'later', label: 'Schedule' }
              ]}
            />
            <p className="gc-show-readout" aria-live="polite">
              {timing === 'now' ? 'Goes out on approval' : 'Fri · 9:00 AM'}
            </p>
          </div>
        </section>

        {/* ───────────────────────── THE STREET: where leads live ───────────────────────── */}
        <section className="gc-street" aria-labelledby={`${idBase}-street`}>
          <div className="gc-street-copy">
            <h2 className="gc-h2" id={`${idBase}-street`} data-reveal>Every shopfront is a lead</h2>
            <p className="gc-lead" data-reveal style={{ '--i': 1 }}>
              Pick a trade and a place, say saree shops on Laxmi Road or dental clinics in Kothrud.
              Lead Gen lists the businesses there with their details, ready for a first email.
            </p>
            <button type="button" className="gc-btn gc-btn-accent" data-reveal style={{ '--i': 2 }} onClick={() => go('leadgen')}>
              Search a street <ArrowRight size={17} aria-hidden="true" />
            </button>
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

        {/* ───────────────────────── HOW IT WORKS: one lead, four stops ───────────────────────── */}
        <section className="gc-strip" id="gc-how" aria-labelledby={`${idBase}-how`}>
          {LEAD_STOPS.map((stop, i) => (
            <div className={`gc-field gc-field-${i}`} key={stop.status} data-reveal style={{ '--i': i }}>
              {i === 0 && (
                <h2 className="gc-strip-title" id={`${idBase}-how`}>One lead, four stops</h2>
              )}
              <article className="gc-card" data-ui aria-label={`Lead card: ${stop.status}`}>
                <div className="gc-card-top">
                  <span className="gc-card-name">{SAMPLE_LEAD.name}</span>
                  <span className={`gc-card-status gc-status-${stop.stage}`}>{stop.status}</span>
                </div>
                <p className="gc-card-meta">{SAMPLE_LEAD.trade} · {SAMPLE_LEAD.area}</p>
                {stop.stage >= 1 && (
                  <p className="gc-card-row">
                    <span className="gc-ui-dim">Subject</span>
                    A quick idea for {SAMPLE_LEAD.name}
                  </p>
                )}
                {stop.stage >= 2 && (
                  <p className="gc-card-row">
                    <span className="gc-ui-dim">Sent Tue 10:42 · replies go to</span>
                    hello@yourstudio.in
                  </p>
                )}
                {stop.stage >= 3 && (
                  <p className="gc-card-reply">“Sounds good. Can you call on Thursday?”</p>
                )}
              </article>
              <p className="gc-clause">
                {stop.clause[0]}
                <br />
                {stop.clause[1]}
              </p>
            </div>
          ))}
        </section>

        {/* ───────────────────────── COMPARE: set as text ───────────────────────── */}
        <section className="gc-compare" id="gc-compare" aria-labelledby={`${idBase}-compare`}>
          <h2 className="gc-h2 gc-compare-title" id={`${idBase}-compare`} data-reveal>Fewer tabs open</h2>
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

        {/* ───────────────────────── CTA: first step, already open ───────────────────────── */}
        <section className="gc-final" aria-labelledby={`${idBase}-final`}>
          <div className="gc-final-copy">
            <h2 className="gc-final-title gc-lines" id={`${idBase}-final`} data-reveal>
              <span className="gc-line"><span style={{ '--i': 0 }}>Start with</span></span>
              <span className="gc-line"><span style={{ '--i': 1 }}>one line.</span></span>
            </h2>
            <p className="gc-lead" data-reveal style={{ '--i': 2 }}>
              {currentUser
                ? 'Your workspace is ready. Pick where to begin and your line comes with you.'
                : 'Sign in, pick where to begin, and your first draft is a sentence away.'}
            </p>
          </div>

          <form
            className="gc-dialog"
            data-ui
            data-reveal
            aria-labelledby={`${idBase}-dialog`}
            onSubmit={(e) => {
              e.preventDefault();
              go(start);
            }}
          >
            <p className="gc-dialog-title" id={`${idBase}-dialog`}>Where do you want to start?</p>
            <label className="gc-ui-label" htmlFor={`${idBase}-line2`}>Your line</label>
            <input
              id={`${idBase}-line2`}
              className="gc-ui-input"
              value={line}
              maxLength={90}
              spellCheck="false"
              onChange={(e) => setLine(e.target.value)}
            />
            <Segmented
              name={`${idBase}-start`}
              label="Workspace"
              value={start}
              onChange={setStart}
              options={[
                { value: 'social', label: 'Social Studio' },
                { value: 'leadgen', label: 'Lead Generation' }
              ]}
            />
            <button type="submit" className="gc-ui-btn gc-ui-btn-block">
              {start === 'social' ? 'Open Social Studio' : 'Find leads'}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>
        </section>
      </main>

      {/* ───────────────────────── FOOTER: a single quiet line ───────────────────────── */}
      <footer className="gc-footer">
        <p className="gc-footer-what">GrowthCrew, a product by In2Peta</p>
        <nav className="gc-footer-nav" aria-label="Footer">
          <button type="button" onClick={() => go('social')}>Social Studio</button>
          <button type="button" onClick={() => go('leadgen')}>Lead Gen</button>
          <a href="#gc-how">How it works</a>
          <button type="button" onClick={onLoginClick}>Log in</button>
        </nav>
        <p className="gc-footer-copy">&copy; {YEAR} In2Peta</p>
      </footer>
    </div>
  );
}
