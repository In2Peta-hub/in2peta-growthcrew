export const DEMO_DATA = {
  gym:{
    key:'gym',
    brand:'IronPulse Gym',
    site:'ironpulse.fit',
    industry:'Fitness & wellness · Austin, TX',
    offer:'$39/mo membership subscription',
    goal:'Grow memberships',
    context:[
      'Subscription membership, $39/month, no joining fee',
      'Primary buyer: urban professionals 22–38, trains 3–5×/week',
      'Top competitors: 3 boutique gyms within 2km, 1 national chain',
      'Reviews: 4.7-star average across Google & ClassPass'
    ],
    score:{ overall:34, subs:[['Technical SEO',41,'#6b2fe0'],['Content & keywords',28,'#14a874'],['Local / maps',22,'#b5750a'],['Authority & backlinks',18,'#e0604a']] },
    findings:[
      { agent:'SEO',   sev:'critical', t:'No structured data on the landing page', fix:'GrowthCrew generates LocalBusiness + Offer + FAQ schema and ships it in 4 minutes' },
      { agent:'SEO',   sev:'high',    t:'Title tags missing on 14 of 31 indexable pages', fix:'Titles generated from location + offer + intent keyword' },
      { agent:'SEO',   sev:'high',    t:'LCP 4.6s on mobile — hero image is 1.9 MB', fix:'Auto-compress, serve AVIF, preload LCP element' },
      { agent:'SEO',   sev:'high',    t:'Google Business Profile not linked in schema', fix:'Connect GBP and inject localBusiness markup sitewide' },
      { agent:'SEO',   sev:'medium',  t:'No review markup, so 4.7-star is invisible to Google', fix:'Aggregate ClassPass + Google reviews into Review schema' },
      { agent:'Social',sev:'high',    t:'No presence on Instagram, TikTok, YouTube or X', fix:'Agent opens accounts, writes 20 posts from 5 pillars, schedules 5/week' },
      { agent:'Social',sev:'medium',  t:'Nothing is being captured — no email or SMS list', fix:'Traffic agent adds a 2-step welcome offer and links it to a landing page' },
      { agent:'Ads',   sev:'high',    t:'No ads account, no pixel, no conversion tracking', fix:'Create pixel + conversion API, then 3 small tests per channel' },
      { agent:'Ads',   sev:'medium',  t:'Landing page has no trial CTA above the fold', fix:'Rewrite hero with “First week free” + single form + calendar booking' },
      { agent:'Influence',sev:'high',t:'No creator partnerships, no social proof beyond reviews', fix:'Source 5 Austin fitness micro-creators under $60 each' },
      { agent:'Lead',  sev:'medium',  t:'No outbound list — every lead currently walks past the door', fix:'Build a 400-person list from competitor member pages + local events' }
    ],
    agents:[
      { name:'Grow Customers', tag:'Automatic', icon:'users',  status:'Running', stat:'214 qualified leads', color:'#6b2fe0' },
      { name:'Grow Social',    tag:'Approval',   icon:'share',  status:'Drafting', stat:'20 posts queued',   color:'#a083f2' },
      { name:'Grow Traffic',   tag:'Ships fixes',icon:'search', status:'Fixing',  stat:'6 fixes shipped',   color:'#14a874' },
      { name:'Grow Influence', tag:'Approval',   icon:'star',   status:'Outreach', stat:'5 creators found',  color:'#b5750a' },
      { name:'Grow Ads',       tag:'Approval',   icon:'megaphone', status:'Testing', stat:'3 campaigns live', color:'#2b8fd6' }
    ],
    seo:{
      score:34,
      issues:[
        {t:'No structured data on landing page', sev:'critical', pages:1,  impact:96},
        {t:'Title tags missing (14 of 31 pages)', sev:'high',    pages:14, impact:84},
        {t:'LCP 4.6s on mobile (hero 1.9 MB)',   sev:'high',    pages:1,  impact:76},
        {t:'Google Business Profile not linked',  sev:'high',    pages:1,  impact:71},
        {t:'No Review schema (4.7-star unseen)',      sev:'medium',  pages:0,  impact:58},
        {t:'Core Web Vitals failing',            sev:'medium',  pages:9,  impact:44},
        {t:'Duplicate H1 across 6 pages',         sev:'low',     pages:6,  impact:29}
      ],
      kws:[['gym membership austin',32,'#6b2fe0'],['gym near me',27,'#a083f2'],['boutique gym subscription',19,'#14a874'],['strength training classes',14,'#2b8fd6'],['affordable gym austin',11,'#b5750a']]
    },
    social:{
      presence:'None — no accounts on Instagram, TikTok, YouTube or X',
      recommended:['Instagram (primary)','TikTok (secondary)','YouTube Shorts (retention)'],
      rationale:'Your buyer is 22–38 and already spends 54 min/day on Instagram Reels and 38 min on TikTok. Reels-style short video is the cheapest format that shows a gym membership in action.',
      pillars:['Form-check tips','Member transformations','Coach Q&A','The gym tour','Offer promos'],
      cadence:'5 posts / week · 3 Reels, 1 carousel, 1 story set',
      handles:['@ironpulse.austin','@ironpulse.tx','@ironpulse.hq'],
      projected:'0 → 3,400 followers in 90 days'
    },
    ads:{
      total:200,
      rationale:'Instagram delivers 2.4× more reach per dollar for subscription fitness offers in Austin than any other channel, and Reels creatives outperform static by 61% in this category. Google is kept as a smaller capture layer for “gym near me” intent.',
      channels:[
        {n:'Instagram Reels', icon:'share',    spend:130, reach:'34,200', cpm:'$3.80', cac:'$4.10', color:'#6b2fe0'},
        {n:'Google Search',  icon:'search',   spend:70,  reach:'9,800',  cpm:'$7.10', cac:'$2.60', color:'#14a874'}
      ],
      creatives:['"First week free — no joining fee" Reel, gym interior','Before/after strength coaching carousel','"Why Austin memberships jump in January" founder-to-camera'],
      projected:{impressions:'44,000', clicks:'1,540', trials:'410', paid:'27'}
    },
    influencer:{
      budget:100,
      members:38, cac:2.63,
      rationale:'$100 of creator content reaches ~42,000 people in Austin who already follow fitness. At the observed 3.7% click and 24% trial rate, that is 38 new paying members — a $2.63 cost per member against $39 MRR.',
      creators:[
        {n:'Maya R.', handle:'@mayastrong', followers:'41.2K', niche:'Strength coaching', price:'$35', color:'#b5750a'},
        {n:'Jordan L.', handle:'@jfitwithj', followers:'18.6K', niche:'City lifestyle + gym', price:'$30', color:'#6b2fe0'},
        {n:'Sam K.', handle:'@samstrength', followers:'26.4K', niche:'Beginner lifting', price:'$35', color:'#14a874'}
      ],
      deliverables:'1 Reel + 3 stories + 1 link-in-bio mention, 30-day usage rights'
    },
    projection:{
      labels:['D1','D4','D7','D10','D13','D16','D19','D22','D25','D28','D30'],
      series:[{n:'Paid (ads + influencers)', c:'#6b2fe0', v:[0,1,3,6,10,15,21,28,36,45,51]},
              {n:'Organic (SEO + social)', c:'#14a874', v:[0,0,1,2,4,6,9,12,15,18,21]},
              {n:'Outbound (lead agent)',  c:'#2b8fd6', v:[0,0,1,1,3,4,6,8,10,11,11]}],
      totals:[0,1,4,9,17,25,36,48,61,74,83],
      revenue:[0,39,156,351,663,975,1404,1872,2379,2886,3237]
    },
    funnel:[
      {l:'Ad + creator impressions', v:'86,000', w:100, c:'#6b2fe0'},
      {l:'Clicks',                   v:'2,960',  w:74,  c:'#a083f2'},
      {l:'Landing page visits',      v:'2,960',  w:74,  c:'#2b8fd6'},
      {l:'Free-week trials',         v:'742',   w:46,  c:'#b5750a'},
      {l:'Paid memberships',         v:'83',    w:20,  c:'#14a874'}
    ],
    plan:[
      {w:'Week 1', items:[
        {ag:'ag-seo', b:'Ship 6 technical fixes', t:'Schema, titles, LCP, GBP link, review markup'},
        {ag:'ag-soc', b:'Open accounts + publish', t:'Instagram + TikTok, 5 posts live, bio link to trial page'},
        {ag:'ag-ads', b:'Launch 3 small ad tests', t:'$20 each — Reel, carousel, search. Track CAC only'},
        {ag:'ag-inf', b:'Brief 3 creators', t:'$35 + $30 + $35. Approve drafts before posting'}
      ]},
      {w:'Week 2', items:[
        {ag:'ag-seo', b:'Rewrite 8 location + offer pages', t:'Austin, Round Rock, Cedar Park variants'},
        {ag:'ag-soc', b:'First influencer posts go live', t:'3 creators, 1 Reel each + stories'},
        {ag:'ag-ads', b:'Scale the winner, kill the loser', t:'Shift spend to lowest CAC creative'},
        {ag:'ag-lead', b:'Start 214-lead outreach', t:'Personalised first message per segment'}
      ]},
      {w:'Week 3', items:[
        {ag:'ag-soc', b:'Double down on the best-performing pillar', t:'Shift content mix toward member transformations'},
        {ag:'ag-ads', b:'Add retargeting layer', t:'$30 to video viewers + trial abandoners'},
        {ag:'ag-inf', b:'Negotiate month-2 deals', t:'Ask for 2 posts for the price of 1'},
        {ag:'ag-seo', b:'Publish 4 comparison pages', t:'vs. chain gyms, vs. F45, vs. CrossFit'}
      ]},
      {w:'Week 4', items:[
        {ag:'ag-lead', b:'Second wave + review the week', t:'Fresh segment, same offer, new angle'},
        {ag:'ag-ads', b:'Reallocate to top channel', t:'Influencers outperforming ads 1.4× → move $40'},
        {ag:'ag-soc', b:'Plan month 2 calendar', t:'8 posts scheduled ahead'},
        {ag:'ag-seo', b:'Report + next keyword batch', t:'Rank movement on 12 tracked terms'}
      ]}
    ],
    toggles:[
      {t:'Publish social posts automatically', s:'5 per week across IG + TikTok', on:true},
      {t:'Auto-apply on-page SEO fixes', s:'Schema, titles, meta, speed — all reviewed weekly', on:true},
      {t:'Send outbound lead messages', s:'214 leads · paused until you approve the template', on:false},
      {t:'Run paid campaigns under $200', s:'GrowthCrew pauses anything above the cap', on:true},
      {t:'Book creator deals under $50 each', s:'Negotiation + invoice handled by GrowthCrew', on:true}
    ],
    summary:{customers:83, mrr:'$3,237', cac:'$2.54', spend:'$300', saved:'14.2h'}
  },

  saas:{
    key:'saas',
    brand:'Nova Analytics',
    site:'novaanalytics.io',
    industry:'B2B SaaS · ecommerce ops teams',
    offer:'$49/mo dashboard',
    goal:'Sign up more trial accounts',
    context:[
      'Product-led B2B SaaS, $49/mo, self-serve, 14-day trial',
      'Buyer: ecommerce ops manager at a 5–50 person brand',
      'Competitors: 6 dashboards, all with strong SEO',
      'No social presence beyond a stale LinkedIn page'
    ],
    score:{ overall:41, subs:[['Technical SEO',55,'#6b2fe0'],['Content & keywords',36,'#14a874'],['Pages & landing pages',29,'#b5750a'],['Authority & backlinks',22,'#e0604a']] },
    findings:[
      { agent:'SEO',   sev:'critical', t:'No SoftwareApplication schema on the homepage', fix:'GrowthCrew generates schema + pricing + FAQ markup sitewide' },
      { agent:'SEO',   sev:'high',    t:'22 pages have no meta description', fix:'Generated from page intent, under 155 chars, with a CTA' },
      { agent:'SEO',   sev:'high',    t:'No /integrations pages for Shopify, Klaviyo, Stripe', fix:'Build 6 programmatic pages targeting "X integration" intent' },
      { agent:'SEO',   sev:'medium',  t:'TTFB 2.1s — unoptimised server-side rendering', fix:'Cache at the edge, defer non-critical JS' },
      { agent:'Social',sev:'high',    t:'LinkedIn posted 3 times, last one 5 months ago', fix:'Agent drafts 12 posts from 4 pillars, 4/week' },
      { agent:'Social',sev:'medium',  t:'No founder-led content, no proof points published', fix:'Turn 3 customer wins into case posts + carousel breakdowns' },
      { agent:'Ads',   sev:'high',    t:'No ad account, pixel or conversion tracking', fix:'Install pixel + conversion API, then 3 intent tests' },
      { agent:'Ads',   sev:'medium',  t:'Pricing page has no comparison table or annual anchor', fix:'Add annual-vs-monthly anchor and a "vs. spreadsheets" block' },
      { agent:'Influence',sev:'medium',t:'No creator or community presence in the niche', fix:'Source 4 B2B creators and 2 community newsletters' },
      { agent:'Lead',  sev:'medium',  t:'Trial signup needs no email before the aha moment', fix:'Aha-moment checklist → 3-step email sequence' }
    ],
    agents:[
      { name:'Grow Customers', tag:'Automatic', icon:'users',  status:'Running', stat:'96 qualified leads', color:'#6b2fe0' },
      { name:'Grow Social',    tag:'Approval',   icon:'share',  status:'Drafting', stat:'12 posts queued',   color:'#a083f2' },
      { name:'Grow Traffic',   tag:'Ships fixes',icon:'search', status:'Fixing',  stat:'4 fixes shipped',   color:'#14a874' },
      { name:'Grow Influence', tag:'Approval',   icon:'star',   status:'Outreach', stat:'6 creators found',  color:'#b5750a' },
      { name:'Grow Ads',       tag:'Approval',   icon:'megaphone', status:'Testing', stat:'3 campaigns live', color:'#2b8fd6' }
    ],
    seo:{
      score:41,
      issues:[
        {t:'No SoftwareApplication schema', sev:'critical', pages:1,  impact:94},
        {t:'22 pages missing meta descriptions', sev:'high', pages:22, impact:82},
        {t:'No /integrations pages for 6 tools', sev:'high', pages:0,  impact:79},
        {t:'TTFB 2.1s on server-rendered pages', sev:'medium', pages:11, impact:61},
        {t:'6 blog posts are thin (<400 words)', sev:'medium', pages:6, impact:47},
        {t:'No author pages or E-E-A-T signals', sev:'low',    pages:0,  impact:32}
      ],
      kws:[['shopify analytics dashboard',28,'#6b2fe0'],['ecommerce reporting tool',22,'#a083f2'],['klaviyo integration',17,'#14a874'],['stripe revenue dashboard',11,'#2b8fd6'],['ecommerce ops software',9,'#b5750a']]
    },
    social:{
      presence:'Only LinkedIn — 3 posts, nothing published in 5 months',
      recommended:['LinkedIn (primary)','X (secondary)','YouTube (demos)'],
      rationale:'Your buyer lives in LinkedIn feeds and niche X communities before they ever search for a dashboard. Founder-led teardown posts outperform product screenshots in B2B SaaS by roughly 3×.',
      pillars:['Ecommerce teardowns','Shopify tips','Customer wins','Behind the build'],
      cadence:'4 posts / week · 2 text posts, 1 carousel, 1 short demo',
      handles:['@novaanalytics','@novaanalyticsio'],
      projected:'0 → 1,900 followers in 90 days'
    },
    ads:{
      total:200,
      rationale:'B2B buyers self-select through high-intent search. Google captures people already comparing dashboards; LinkedIn retargets the 2% who visited pricing but did not start a trial.',
      channels:[
        {n:'Google Search',  icon:'search', spend:120, reach:'6,400', cpm:'$18.70', cac:'$5.10', color:'#14a874'},
        {n:'LinkedIn Ads',   icon:'share',  spend:80,  reach:'11,200', cpm:'$7.14', cac:'$7.80', color:'#6b2fe0'}
      ],
      creatives:['"Shopify reporting, minus the spreadsheet" search ad set','3 competitor comparison landing variants','LinkedIn founder-led video ad'],
      projected:{impressions:'17,600', clicks:'640', trials:'180', paid:'39'}
    },
    influencer:{
      budget:100,
      members:22, cac:4.55,
      rationale:'B2B audiences are smaller but convert hard. $100 across 3 niche creators plus 2 newsletters reaches ~12,000 operators and produced 22 paying accounts.',
      creators:[
        {n:'Priya N.', handle:'@ecomnotes', followers:'9.8K', niche:'Ecommerce ops', price:'$30', color:'#6b2fe0'},
        {n:'Dev R.', handle:'@devopsdaily', followers:'14.2K', niche:'Founder content', price:'$35', color:'#14a874'},
        {n:'Marc T.', handle:'@theecompodcast', followers:'7.4K', niche:'Podcast + newsletter', price:'$35', color:'#b5750a'}
      ],
      deliverables:'1 post + 1 mention, newsletter slot, 30-day usage rights'
    },
    projection:{
      labels:['D1','D4','D7','D10','D13','D16','D19','D22','D25','D28','D30'],
      series:[{n:'Paid (ads + influencers)', c:'#6b2fe0', v:[0,0,1,3,6,10,14,19,25,32,38]},
              {n:'Organic (SEO + social)', c:'#14a874', v:[0,0,0,1,2,4,6,9,12,16,20]},
              {n:'Outbound (lead agent)',  c:'#2b8fd6', v:[0,0,1,2,3,4,6,8,10,11,13]}],
      totals:[0,0,2,6,11,18,26,36,47,59,71],
      revenue:[0,0,98,294,539,882,1274,1764,2303,2891,3479]
    },
    funnel:[
      {l:'Ad + creator impressions', v:'29,600', w:100, c:'#6b2fe0'},
      {l:'Clicks',                   v:'1,180',  w:60,  c:'#a083f2'},
      {l:'Landing page visits',      v:'1,180',  w:60,  c:'#2b8fd6'},
      {l:'Trials started',           v:'340',   w:34,  c:'#b5750a'},
      {l:'Paid accounts',            v:'71',    w:16,  c:'#14a874'}
    ],
    plan:[
      {w:'Week 1', items:[
        {ag:'ag-seo', b:'Ship schema + meta on 22 pages', t:'SoftwareApplication, Organization, FAQ'},
        {ag:'ag-soc', b:'Revive LinkedIn', t:'4 posts published, founder voice, 1 carousel'},
        {ag:'ag-ads', b:'Launch 3 intent tests', t:'$40 each on Shopify-analytics keywords'},
        {ag:'ag-inf', b:'Reach 3 B2B creators', t:'$30 + $35 + $35, all under $70 CPM'}
      ]},
      {w:'Week 2', items:[
        {ag:'ag-seo', b:'Build 6 integration pages', t:'Shopify, Klaviyo, Stripe, BigCommerce'},
        {ag:'ag-soc', b:'Publish first teardown', t:'"Why spreadsheets break at 10k orders"'},
        {ag:'ag-ads', b:'Kill losers, scale winner', t:'Shift to lowest CAC keyword group'},
        {ag:'ag-lead', b:'Start 96-lead outreach', t:'Ops managers at 5–50 person brands'}
      ]},
      {w:'Week 3', items:[
        {ag:'ag-soc', b:'Add a customer-wins series', t:'3 case studies turned into posts'},
        {ag:'ag-ads', b:'Add comparison landing pages', t:'vs. spreadsheets, vs. Looker, vs. Grow'},
        {ag:'ag-inf', b:'Newsletter sponsorships', t:'2 slots, $25 each, tracked links'},
        {ag:'ag-seo', b:'Ship the aha-moment email flow', t:'Trial → value → upgrade, 3 steps'}
      ]},
      {w:'Week 4', items:[
        {ag:'ag-lead', b:'Second wave + demo bookings', t:'Fresh segment, same offer'},
        {ag:'ag-ads', b:'Reallocate by CAC', t:'Google holding CAC at $5.10 — keep spend'},
        {ag:'ag-soc', b:'Schedule month 2', t:'8 posts queued ahead'},
        {ag:'ag-seo', b:'Rank report', t:'Movement on 14 tracked terms'}
      ]}
    ],
    toggles:[
      {t:'Publish social posts automatically', s:'4 per week across LinkedIn + X', on:true},
      {t:'Auto-apply on-page SEO fixes', s:'Schema, meta, speed — reviewed weekly', on:true},
      {t:'Send outbound lead messages', s:'96 leads · paused until you approve the template', on:false},
      {t:'Run paid campaigns under $200', s:'GrowthCrew pauses anything above the cap', on:true},
      {t:'Sponsor newsletters under $40', s:'2 slots per month, tracked', on:false}
    ],
    summary:{customers:71, mrr:'$3,479', cac:'$2.82', spend:'$300', saved:'12.6h'}
  },

  coffee:{
    key:'coffee',
    brand:'Northline Roasters',
    site:'northlineroasters.com',
    industry:'DTC specialty coffee · ships nationwide',
    offer:'$18/month subscription, 2 bags',
    goal:'Grow subscriptions',
    context:[
      'DTC coffee subscription, $18/month for 2 bags',
      'Buyer: remote professionals 28–45, home brewers',
      'Competitors: 4 national subscriptions, 9 local roasters',
      'Strong product reviews (4.8-star), weak discovery channels'
    ],
    score:{ overall:52, subs:[['Technical SEO',63,'#6b2fe0'],['Content & keywords',48,'#14a874'],['Product pages',55,'#b5750a'],['Authority & backlinks',31,'#e0604a']] },
    findings:[
      { agent:'SEO',   sev:'high',    t:'No Product + Offer schema on 24 product pages', fix:'Schema + price, availability and review markup generated' },
      { agent:'SEO',   sev:'high',    t:'Title tags missing on 11 of 28 pages', fix:'Origin + roast + intent keyword titles' },
      { agent:'SEO',   sev:'medium',  t:'No shipping-cost information in schema', fix:'Adding shippingDetails improves rich-result eligibility' },
      { agent:'Social',sev:'high',    t:'No Instagram or TikTok presence', fix:'Agent opens accounts, writes 16 posts from 4 pillars' },
      { agent:'Social',sev:'medium',  t:'Brew guides exist but are not social-ready', fix:'Repurpose each guide into a 30-second Reel script' },
      { agent:'Ads',   sev:'high',    t:'No Meta pixel or purchase event', fix:'Install pixel + Conversions API for subscription events' },
      { agent:'Ads',   sev:'medium',  t:'Subscription offer is buried below the fold', fix:'Move the $18 offer into the hero + sticky CTA' },
      { agent:'Influence',sev:'medium',t:'No creator or cafe partnerships', fix:'Source 5 home-brewer micro-creators under $40' },
      { agent:'Lead',  sev:'medium',  t:'Gift subscriptions ignored — a free acquisition channel', fix:'Build a gifting flow + outreach to local cafes' }
    ],
    agents:[
      { name:'Grow Customers', tag:'Automatic', icon:'users',  status:'Running', stat:'163 qualified leads', color:'#6b2fe0' },
      { name:'Grow Social',    tag:'Approval',   icon:'share',  status:'Drafting', stat:'16 posts queued',   color:'#a083f2' },
      { name:'Grow Traffic',   tag:'Ships fixes',icon:'search', status:'Fixing',  stat:'5 fixes shipped',   color:'#14a874' },
      { name:'Grow Influence', tag:'Approval',   icon:'star',   status:'Outreach', stat:'5 creators found',  color:'#b5750a' },
      { name:'Grow Ads',       tag:'Approval',   icon:'megaphone', status:'Testing', stat:'2 campaigns live', color:'#2b8fd6' }
    ],
    seo:{
      score:52,
      issues:[
        {t:'No Product/Offer schema on product pages', sev:'high', pages:24, impact:88},
        {t:'Title tags missing (11 of 28 pages)', sev:'high', pages:11, impact:77},
        {t:'No shippingDetails in schema', sev:'medium', pages:24, impact:59},
        {t:'Origin story not marked up for entities', sev:'medium', pages:2, impact:48},
        {t:'No brew-guide internal linking', sev:'low', pages:6, impact:31}
      ],
      kws:[['coffee subscription',26,'#6b2fe0'],['best coffee subscription',19,'#a083f2'],['single origin coffee monthly',14,'#14a874'],['brew guide',9,'#2b8fd6'],['light roast coffee',8,'#b5750a']]
    },
    social:{
      presence:'None — no Instagram, TikTok or YouTube',
      recommended:['Instagram (primary)','TikTok (secondary)','YouTube (brew guides)'],
      rationale:'Coffee is a native short-video category. Brew videos drive saves and shares, and Reels reach in the coffee niche is 3.1× a typical brand’s feed reach.',
      pillars:['Brew guides','Bean origins','Roast reactions','Subscription drops'],
      cadence:'5 posts / week · 3 Reels, 1 carousel, 1 story set',
      handles:['@northlineroasters','@northline.coffee'],
      projected:'0 → 4,100 followers in 90 days'
    },
    ads:{
      total:200,
      rationale:'Meta converts direct-to-consumer subscriptions better than search because the buying decision is visual and impulsive. Google is limited to brand + "coffee subscription" terms where intent is already high.',
      channels:[
        {n:'Instagram Reels', icon:'share',  spend:140, reach:'41,000', cpm:'$3.41', cac:'$3.20', color:'#6b2fe0'},
        {n:'Google Search',  icon:'search', spend:60,  reach:'8,100',  cpm:'$7.40', cac:'$2.90', color:'#14a874'}
      ],
      creatives:['60-second pour-over Reel, ASMR audio','"Why this month\'s Ethiopia tastes like apricot"','Subscription-box unboxing carousel'],
      projected:{impressions:'49,100', clicks:'1,880', trials:'520', paid:'44'}
    },
    influencer:{
      budget:100,
      members:41, cac:2.44,
      rationale:'$100 across 4 home-brewer creators reaches ~47,000 coffee drinkers. At 3.9% click-through and 26% trial rate that is 41 new subscribers at $2.44 each against $18 MRR.',
      creators:[
        {n:'Alex B.', handle:'@brewhq', followers:'22.4K', niche:'Home brewing', price:'$25', color:'#6b2fe0'},
        {n:'Nia P.', handle:'@niacoffee', followers:'15.9K', niche:'Morning routine', price:'$25', color:'#14a874'},
        {n:'Tom H.', handle:'@tomgrind', followers:'31.2K', niche:'Gear reviews', price:'$25', color:'#b5750a'},
        {n:'Eve L.', handle:'@evebrews', followers:'12.8K', niche:'Latte art', price:'$25', color:'#2b8fd6'}
      ],
      deliverables:'1 Reel + 2 stories each, code NORTHLINE, 30-day usage rights'
    },
    projection:{
      labels:['D1','D4','D7','D10','D13','D16','D19','D22','D25','D28','D30'],
      series:[{n:'Paid (ads + influencers)', c:'#6b2fe0', v:[0,1,3,7,12,18,25,33,42,52,62]},
              {n:'Organic (SEO + social)', c:'#14a874', v:[0,0,1,2,4,6,9,12,16,20,25]},
              {n:'Outbound (lead agent)',  c:'#2b8fd6', v:[0,0,0,1,2,3,4,5,7,8,9]}],
      totals:[0,1,4,10,18,27,38,50,65,80,96],
      revenue:[0,18,72,180,324,486,684,900,1170,1440,1728]
    },
    funnel:[
      {l:'Ad + creator impressions', v:'96,000', w:100, c:'#6b2fe0'},
      {l:'Clicks',                   v:'3,740',  w:78,  c:'#a083f2'},
      {l:'Landing page visits',      v:'3,740',  w:78,  c:'#2b8fd6'},
      {l:'Free-bag trials',          v:'1,010',  w:52,  c:'#b5750a'},
      {l:'Paid subscriptions',       v:'96',    w:22,  c:'#14a874'}
    ],
    plan:[
      {w:'Week 1', items:[
        {ag:'ag-seo', b:'Ship Product + Offer schema', t:'24 product pages, price + reviews + shipping'},
        {ag:'ag-soc', b:'Open IG + TikTok', t:'16 posts queued, 4 pillars, brew guides first'},
        {ag:'ag-ads', b:'Launch 2 Meta tests', t:'$70 each — Reel vs. carousel'},
        {ag:'ag-inf', b:'Brief 4 brewers', t:'$25 each with code NORTHLINE'}
      ]},
      {w:'Week 2', items:[
        {ag:'ag-seo', b:'Rewrite 11 titles + metas', t:'Origin + roast + intent'},
        {ag:'ag-soc', b:'First brew Reel goes live', t:'V60 pour-over, 30 sec'},
        {ag:'ag-ads', b:'Scale the winning format', t:'Reels won — move $30 from carousel'},
        {ag:'ag-lead', b:'Start gifting outreach', t:'Local cafes + 163 leads'}
      ]},
      {w:'Week 3', items:[
        {ag:'ag-soc', b:'Publish a bean-origin series', t:'Ethiopia, Colombia, Kenya, 1 per week'},
        {ag:'ag-ads', b:'Add retargeting', t:'$30 to video viewers and cart abandoners'},
        {ag:'ag-inf', b:'Renegotiate usage rights', t:'Add 2 extra posts for the same fee'},
        {ag:'ag-seo', b:'Build 3 origin landing pages', t:'One per single-origin, with brew guide'}
      ]},
      {w:'Week 4', items:[
        {ag:'ag-lead', b:'Second wave + gifting push', t:'Holiday / new-year subscriber gift'},
        {ag:'ag-ads', b:'Reallocate by CAC', t:'Creators still beating paid 1.5×'},
        {ag:'ag-soc', b:'Schedule month 2', t:'10 posts queued, 2 creator collabs'},
        {ag:'ag-seo', b:'Rank report', t:'Movement on 11 tracked terms'}
      ]}
    ],
    toggles:[
      {t:'Publish social posts automatically', s:'5 per week across IG + TikTok', on:true},
      {t:'Auto-apply on-page SEO fixes', s:'Schema, titles, meta, speed', on:true},
      {t:'Send outbound lead messages', s:'163 leads · paused until you approve the template', on:false},
      {t:'Run paid campaigns under $200', s:'GrowthCrew pauses anything above the cap', on:true},
      {t:'Book creator deals under $40 each', s:'Negotiation + invoice handled by GrowthCrew', on:true}
    ],
    summary:{customers:96, mrr:'$1,728', cac:'$2.08', spend:'$300', saved:'13.1h'}
  }
};
