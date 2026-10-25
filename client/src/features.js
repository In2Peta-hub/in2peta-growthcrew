// The five growth agents plus the shared reporting view. `status` is the
// single source of truth for what the product can do today; the landing page,
// workspace navigation and roadmap all read from here so they never disagree.

export const MODULES = [
  {
    id: 'leads',
    name: 'Lead Gen',
    nav: 'Leads',
    tagline: 'Find people worth talking to',
    status: 'live',
    icon: 'users',
    color: 'violet',
    summary:
      'Describe the people you want to meet. See up to five matches before you sign up, then keep or skip each person and get a first message written for them.',
    capabilities: [
      'Plain-language search across business records and live listings',
      'Up to five preview matches before you create an account',
      'Keep or skip each person; kept leads get a first message',
      'Optional Monday email with ten more people to review',
    ],
  },
  {
    id: 'social',
    name: 'Social Studio',
    nav: 'Social',
    tagline: 'Write, schedule and publish',
    status: 'live',
    icon: 'share',
    color: 'lavender',
    summary:
      'Write a post with AI, preview it in the native format for each network, then schedule or publish to the channels you have connected.',
    capabilities: [
      'AI captions with an editable hook, body and hashtags',
      'Native previews for Instagram, Facebook, LinkedIn, X, Reddit, YouTube and Discord',
      'Review queue and published history in one place',
      'Connect your own channels; nothing is published without review unless you turn on auto-publish',
    ],
  },
  {
    id: 'seo',
    name: 'SEO',
    nav: 'SEO',
    tagline: 'Fix what limits organic traffic',
    status: 'soon',
    icon: 'search',
    color: 'mint',
    summary:
      'Audit the pages that should bring buyers in, rank the fixes by impact, and ship the safe changes with your approval.',
    capabilities: [
      'Technical audit for indexation, schema, speed and mobile',
      'Keyword map built around what your buyers actually type',
      'Titles, meta and page drafts in your voice',
      'A weekly list of what shipped and what moved',
    ],
  },
  {
    id: 'influencer',
    name: 'Influencers',
    nav: 'Influencers',
    tagline: 'Borrow trust without the guesswork',
    status: 'soon',
    icon: 'star',
    color: 'amber',
    summary:
      'Find creators whose audience overlaps yours, check that the engagement is real, and keep every brief and deliverable in one thread.',
    capabilities: [
      'Creator discovery by niche, city and audience fit',
      'Engagement and brand-fit checks before you reach out',
      'Briefs, deliverables and usage rights in one place',
      'Every deal waits for your approval before it is booked',
    ],
  },
  {
    id: 'ads',
    name: 'Paid ads',
    nav: 'Ads',
    tagline: 'Small budget, hard-working',
    status: 'soon',
    icon: 'megaphone',
    color: 'sky',
    summary:
      'Plan where a small budget goes hardest, write the variants, and move spend only when the numbers say so.',
    capabilities: [
      'Channel choice based on audience and offer, not defaults',
      'Ad concepts, headlines and image direction',
      'A spend cap you control; nothing above it runs',
      'Weekly reallocation based on cost per customer',
    ],
  },
  {
    id: 'reports',
    name: 'Reports',
    nav: 'Reports',
    tagline: 'One view across every channel',
    status: 'soon',
    icon: 'chart',
    color: 'coral',
    summary:
      'See what every agent did, what it cost, and what it brought back — in one plain-English weekly review.',
    capabilities: [
      'One queue for anything that spends money',
      'Shared cost per customer across live and coming agents',
      'A short weekly note, not a forty-slide deck',
      'Every number links back to the action that produced it',
    ],
  },
];

export const LIVE_MODULES = MODULES.filter((m) => m.status === 'live');
export const SOON_MODULES = MODULES.filter((m) => m.status === 'soon');

export const getModule = (id) => MODULES.find((m) => m.id === id) || null;

export const WORKSPACE_NAV = [
  { id: 'workspace', name: 'Workspace', status: 'live' },
  ...MODULES.map((m) => ({ id: m.id, name: m.nav, status: m.status })),
];
