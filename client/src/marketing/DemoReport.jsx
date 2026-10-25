import React, { useState } from 'react';
import {
  BarChart3,
  Brain,
  Check,
  Clock3,
  Globe2,
  Layers,
  Link2,
  Megaphone,
  Rocket,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
} from 'lucide-react';
import { DEMO_DATA } from './demoData';
import { MODULE_ICONS } from './moduleIcons';

// The sample data names icons by shape; map them to the module they stand for.
const AGENT_MODULE = { users: 'leads', share: 'social', search: 'seo', star: 'influencer', megaphone: 'ads' };
import './demoReport.css';

// A complete growth report built from the three sample businesses in
// demoData.js. It is the landing page's "look what comes out" artifact, so it
// stays clearly labelled as an example: every number below is sample data, not
// a customer result. The real, working lead preview lives in the hero console.
//
// The layout follows the reference design (context brief → headline numbers →
// diagnosis → five agent plans → funnel → projection → 30-day plan) but the
// type, colour and spacing come from GrowthCrew's brand tokens.

const DATASET_KEYS = Object.keys(DEMO_DATA);

const num = (value) => parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;

const usd = (value) =>
  `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

const scoreColor = (score) =>
  score < 40 ? 'var(--gcr-coral)' : score < 60 ? 'var(--gcr-amber)' : 'var(--gcr-mint)';

const severityColor = (severity) =>
  ({
    critical: 'var(--gcr-coral)',
    high: 'var(--gcr-amber)',
    medium: 'var(--gcr-sky)',
    low: 'var(--gcr-mint)',
  })[severity] || 'var(--gcr-mint)';

const AGENT_LABELS = {
  'ag-seo': 'SEO',
  'ag-soc': 'Social',
  'ag-ads': 'Ads',
  'ag-inf': 'Creator',
  'ag-lead': 'Lead',
};

const AGENT_COLORS = {
  'ag-seo': 'mint',
  'ag-soc': 'lavender',
  'ag-ads': 'sky',
  'ag-inf': 'amber',
  'ag-lead': 'violet',
};

const AGENT_ICONS = {
  'ag-seo': Search,
  'ag-soc': Share2,
  'ag-ads': Megaphone,
  'ag-inf': Star,
  'ag-lead': Users,
};

function StatBox({ tone = '', value, label }) {
  return (
    <div className={`gcr-stat${tone ? ` is-${tone}` : ''}`}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

function Panel({ icon: Icon, title, sub, className = '', children }) {
  return (
    <section className={`gcr-panel ${className}`.trim()}>
      <h3>
        <Icon size={16} aria-hidden="true" />
        {title}
      </h3>
      {sub && <p className="gcr-sub">{sub}</p>}
      {children}
    </section>
  );
}

function Bar({ value, color, className = '' }) {
  return (
    <span className={`gcr-track ${className}`.trim()} aria-hidden="true">
      <span
        className="gcr-fill"
        style={{ '--gcr-w': `${Math.max(0, Math.min(100, value))}%`, background: color }}
      />
    </span>
  );
}

function ScorePanel({ data }) {
  const circumference = 2 * Math.PI * 52;
  const offset = circumference * (1 - data.score.overall / 100);
  const color = scoreColor(data.score.overall);

  return (
    <Panel
      icon={Target}
      title="Opportunity score"
      sub="How much growth is locked up in things nobody is fixing"
    >
      <div className="gcr-ring-wrap">
        <div className="gcr-ring">
          <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden="true" focusable="false">
            <circle cx="66" cy="66" r="52" fill="none" stroke="var(--gcr-track)" strokeWidth="12" />
            <circle
              cx="66"
              cy="66"
              r="52"
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="gcr-ring-value">
            <b style={{ color }}>{data.score.overall}</b>
            <small>/ 100</small>
          </div>
        </div>
        <div className="gcr-metrics">
          {data.score.subs.map(([label, value, barColor]) => (
            <div className="gcr-metric" key={label}>
              <span>{label}</span>
              <Bar value={value} color={barColor} />
              <b>{value}</b>
            </div>
          ))}
          <p className="gcr-fineprint">
            8 competitor sites compared · 9 ranking keywords tracked · 4 review platforms read
          </p>
        </div>
      </div>
    </Panel>
  );
}

function AgentsPanel({ data }) {
  return (
    <Panel
      icon={Brain}
      title="Your agent team — status now"
      sub="Each agent read the same context brief and reported back on its channel"
    >
      <div className="gcr-agents">
        {data.agents.map((agent) => {
          const Icon = MODULE_ICONS[AGENT_MODULE[agent.icon]] || Sparkles;
          return (
            <div className="gcr-agent" key={agent.name}>
              <span
                className="gcr-agent-icon"
                style={{ '--gcr-agent': agent.color }}
              >
                <Icon size={17} aria-hidden="true" />
              </span>
              <div className="gcr-agent-copy">
                <b>{agent.name}</b>
                <span>
                  {agent.tag} · <em style={{ color: agent.color }}>{agent.status}</em>
                </span>
              </div>
              <span className="gcr-agent-stat">{agent.stat}</span>
            </div>
          );
        })}
      </div>
      <p className="gcr-note">
        <b>Why this order:</b> SEO first because traffic compounds and costs nothing — then
        social to build the proof the ads agent needs, then paid spend once the landing page can
        convert it.
      </p>
    </Panel>
  );
}

function FindingsPanel({ data, count }) {
  const order = { SEO: 0, Social: 1, Ads: 2, Influence: 3, Lead: 4 };
  const findings = [...data.findings].sort((a, b) => order[a.agent] - order[b.agent]);
  const badge = {
    SEO: ['ag-seo', 'SEO'],
    Social: ['ag-soc', 'Social'],
    Ads: ['ag-ads', 'Ads'],
    Influence: ['ag-inf', 'Creator'],
    Lead: ['ag-lead', 'Lead'],
  };

  return (
    <Panel
      icon={Layers}
      title={`What we found — ${count} changes`}
      sub="Ranked by revenue impact, with the fix GrowthCrew would apply"
    >
      <div className="gcr-findings">
        {findings.map((finding) => (
          <div className="gcr-finding" key={`${finding.agent}-${finding.t}`}>
            <span
              className="gcr-finding-dot"
              style={{ background: severityColor(finding.sev) }}
              aria-hidden="true"
            />
            <div className="gcr-finding-copy">
              <div className="gcr-finding-tags">
                <span className={`gcr-agent-badge is-${AGENT_COLORS[badge[finding.agent][0]]}`}>
                  {badge[finding.agent][1]}
                </span>
                <span className={`gcr-sev is-${finding.sev}`}>{finding.sev}</span>
              </div>
              <b>{finding.t}</b>
              <span className="gcr-fix">→ {finding.fix}</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SeoPanel({ data }) {
  return (
    <Panel
      icon={Search}
      title="Grow Traffic — SEO audit"
      sub={
        <>
          Site health score{' '}
          <b style={{ color: scoreColor(data.seo.score) }}>{data.seo.score}/100</b> ·{' '}
          {data.seo.issues.length} issues found
        </>
      }
    >
      <div className="gcr-issues">
        {data.seo.issues.map((issue) => (
          <div key={issue.t}>
            <div className="gcr-issue-line">
              <span style={{ color: severityColor(issue.sev) }} aria-hidden="true">
                ●
              </span>
              <span>{issue.t}</span>
              {issue.pages > 0 && <span className="gcr-mono">{issue.pages}p</span>}
            </div>
            <Bar value={issue.impact} color={severityColor(issue.sev)} className="is-thin" />
          </div>
        ))}
      </div>
      <p className="gcr-eyebrow">Keywords GrowthCrew would target</p>
      <div className="gcr-keywords">
        {data.seo.kws.map(([keyword, weight, color]) => (
          <div className="gcr-keyword" key={keyword}>
            <span>{keyword}</span>
            <Bar value={weight * 3} color={color} className="is-tall" />
            <b>{weight}</b>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SocialPanel({ data }) {
  return (
    <Panel icon={Share2} title="Grow Social — presence & plan" sub="Where your buyers already are">
      <div className="gcr-alert">
        <Brain size={15} aria-hidden="true" />
        <p>
          <b>Finding — {data.social.presence}</b>
        </p>
      </div>
      <p className="gcr-eyebrow">Recommended channels</p>
      <div className="gcr-pills">
        {data.social.recommended.map((channel, index) => (
          <span className={`gcr-pill ${index === 0 ? 'is-mint' : 'is-violet'}`} key={channel}>
            {channel}
          </span>
        ))}
      </div>
      <p className="gcr-prose">{data.social.rationale}</p>
      <div className="gcr-rows">
        <div>
          <Target size={14} aria-hidden="true" />
          <p>
            <b>Content pillars</b> — {data.social.pillars.join(' · ')}
          </p>
        </div>
        <div>
          <Clock3 size={14} aria-hidden="true" />
          <p>
            <b>Cadence</b> — {data.social.cadence}
          </p>
        </div>
        <div>
          <Link2 size={14} aria-hidden="true" />
          <p>
            <b>Handles to claim</b> — {data.social.handles.join(' · ')}
          </p>
        </div>
        <div>
          <BarChart3 size={14} aria-hidden="true" />
          <p>
            <b>Projection</b> — {data.social.projected}
          </p>
        </div>
      </div>
    </Panel>
  );
}

function AdsPanel({ data }) {
  const { segments } = data.ads.channels.reduce(
    (acc, channel) => {
      const to = acc.at + (channel.spend / data.ads.total) * 100;
      acc.segments.push(`${channel.color} ${acc.at.toFixed(1)}% ${to.toFixed(1)}%`);
      acc.at = to;
      return acc;
    },
    { at: 0, segments: [] },
  );

  return (
    <Panel icon={Megaphone} title={`Grow Ads — ${usd(data.ads.total)} media plan`} sub="Where the money goes, and why">
      <div className="gcr-donut-wrap">
        <div className="gcr-donut" style={{ background: `conic-gradient(${segments.join(',')})` }}>
          <div className="gcr-donut-center">
            <b>{usd(data.ads.total)}</b>
            <small>Total</small>
          </div>
        </div>
        <div className="gcr-legend">
          {data.ads.channels.map((channel) => (
            <div className="gcr-legend-row" key={channel.n}>
              <span className="gcr-swatch" style={{ background: channel.color }} aria-hidden="true" />
              {channel.n}
              <b>{usd(channel.spend)}</b>
            </div>
          ))}
          <div className="gcr-legend-row is-total">
            <span className="gcr-swatch" style={{ background: 'var(--gcr-track)' }} aria-hidden="true" />
            Creator fees
            <b>$100</b>
          </div>
        </div>
      </div>
      <p className="gcr-quote">{data.ads.rationale}</p>
      <div className="gcr-channels">
        {data.ads.channels.map((channel) => (
          <div className="gcr-channel" key={channel.n}>
            <span className="gcr-channel-name">{channel.n}</span>
            <Bar
              value={(channel.spend / data.ads.total) * 100}
              color={channel.color}
              className="is-tall"
            />
            <span className="gcr-channel-meta">
              {channel.reach} reach · {channel.cac} CAC
            </span>
          </div>
        ))}
      </div>
      <p className="gcr-eyebrow">Ad concepts GrowthCrew writes</p>
      <div className="gcr-creatives">
        {data.ads.creatives.map((creative) => (
          <div key={creative}>
            <Sparkles size={14} aria-hidden="true" />
            <p>{creative}</p>
          </div>
        ))}
      </div>
      <div className="gcr-mini-stats">
        {[
          ['Impressions', data.ads.projected.impressions],
          ['Clicks', data.ads.projected.clicks],
          ['Trials', data.ads.projected.trials],
          ['Paid', data.ads.projected.paid],
        ].map(([label, value]) => (
          <div key={label}>
            <b>{value}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function InfluencerPanel({ data }) {
  return (
    <Panel
      icon={Star}
      title={`Grow Influence — ${usd(data.influencer.budget)} creator budget`}
      sub={`${data.influencer.creators.length} creators found, checked and negotiated within budget`}
    >
      <div className="gcr-stat-strip is-three">
        <StatBox tone="mint" value={data.influencer.members} label="New customers" />
        <StatBox tone="violet" value={usd(data.influencer.cac)} label="Cost per customer" />
        <StatBox
          tone="amber"
          value={`${Math.round((data.influencer.members / data.influencer.budget) * 100)}×`}
          label="Return on spend"
        />
      </div>
      <p className="gcr-quote is-amber">{data.influencer.rationale}</p>
      <p className="gcr-eyebrow">Creators GrowthCrew would book</p>
      <div className="gcr-creators">
        {data.influencer.creators.map((creator) => (
          <div className="gcr-creator" key={creator.handle}>
            <span className="gcr-avatar" style={{ background: creator.color }}>
              {creator.n.charAt(0)}
            </span>
            <div>
              <b>
                {creator.n}{' '}
                <span className="gcr-handle">{creator.handle}</span>
              </b>
              <span>
                {creator.followers} followers · {creator.niche}
              </span>
            </div>
            <span className="gcr-price">{creator.price}</span>
          </div>
        ))}
      </div>
      <p className="gcr-fineprint">Deliverables — {data.influencer.deliverables}</p>
    </Panel>
  );
}

function FunnelPanel({ data }) {
  return (
    <Panel
      icon={BarChart3}
      title="30-day customer funnel"
      sub="From first impression to paying customer · % = conversion from the previous stage"
    >
      <div className="gcr-funnel">
        {data.funnel.map((stage, index) => {
          const previous = index > 0 ? num(data.funnel[index - 1].v) : 0;
          const current = num(stage.v);
          const conversion = index === 0 ? '100%' : previous ? `${((current / previous) * 100).toFixed(1)}%` : '—';
          return (
            <div className="gcr-funnel-row" key={stage.l}>
              <div className="gcr-funnel-top">
                <span>{stage.l}</span>
                <em>{conversion}</em>
                <b>{stage.v}</b>
              </div>
              <span className="gcr-funnel-track" aria-hidden="true">
                <span className="gcr-funnel-fill" style={{ '--gcr-w': `${stage.w}%`, background: stage.c }} />
              </span>
            </div>
          );
        })}
      </div>
      <p className="gcr-note is-mint">
        <b>GrowthCrew note —</b> the step losing the most people is the landing page. Rewriting the
        hero and cutting the form to three fields is the single highest-leverage change in this plan.
      </p>
    </Panel>
  );
}

function ProjectionPanel({ data }) {
  const projection = data.projection;
  const W = 760;
  const H = 270;
  const padLeft = 40;
  const padBottom = 30;
  const padTop = 14;
  const maxY = Math.max(...projection.totals) * 1.18 || 10;
  const x = (index) => padLeft + (index * (W - padLeft - 10)) / (projection.labels.length - 1);
  const y = (value) => H - padBottom - (value / maxY) * (H - padBottom - padTop);

  const linePath = (values) =>
    values.map((value, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)} ${y(value).toFixed(1)}`).join(' ');
  const areaPath = (values) =>
    `${linePath(values)} L ${x(values.length - 1)} ${H - padBottom} L ${padLeft} ${H - padBottom} Z`;

  const dashes = ['', '7 4', '2 4'];
  const lastIndex = projection.totals.length - 1;

  return (
    <Panel
      icon={BarChart3}
      title="30-day projection"
      sub="Cumulative new customers by channel, with the total overlaid"
      className="is-wide"
    >
      <div className="gcr-projection">
        <div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`Line chart: cumulative new customers over 30 days by channel, reaching ${projection.totals[lastIndex]} customers and ${usd(projection.revenue[lastIndex])} added recurring revenue`}
            className="gcr-chart"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
              <g key={fraction}>
                <line
                  x1={padLeft}
                  y1={y(maxY * fraction)}
                  x2={W - 10}
                  y2={y(maxY * fraction)}
                  stroke="var(--gcr-line)"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 7}
                  y={y(maxY * fraction) + 3}
                  fill="var(--gcr-dim)"
                  fontSize="9"
                  textAnchor="end"
                >
                  {Math.round(maxY * fraction)}
                </text>
              </g>
            ))}
            {projection.series.map((series) => (
              <g key={series.n}>
                <path d={areaPath(series.v)} fill={series.c} opacity="0.07" />
                <path
                  d={linePath(series.v)}
                  fill="none"
                  stroke={series.c}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={dashes[projection.series.indexOf(series)] || ''}
                />
                {series.v.map((value, index) => (
                  <circle key={index} cx={x(index)} cy={y(value)} r="2.5" fill={series.c}>
                    <title>{`${series.n} — ${projection.labels[index]}: ${value} customers`}</title>
                  </circle>
                ))}
              </g>
            ))}
            <path
              d={linePath(projection.totals)}
              fill="none"
              stroke="var(--gcr-ink)"
              strokeWidth="1.8"
              strokeDasharray="4 4"
              strokeLinecap="round"
              opacity="0.85"
            />
            {projection.totals.map((value, index) => (
              <circle
                key={index}
                cx={x(index)}
                cy={y(value)}
                r="3.2"
                fill="var(--gcr-panel-solid)"
                stroke="var(--gcr-ink)"
                strokeWidth="1.4"
              >
                <title>{`Total ${projection.labels[index]}: ${value} customers · ${usd(projection.revenue[index])} added recurring revenue`}</title>
              </circle>
            ))}
            {projection.labels.map((label, index) => (
              <text
                key={label}
                x={x(index)}
                y={H - 8}
                fill="var(--gcr-dim)"
                fontSize="9"
                textAnchor="middle"
              >
                {label}
              </text>
            ))}
          </svg>
          <div className="gcr-chart-legend">
            {projection.series.map((series, index) => (
              <span key={series.n}>
                <i
                  style={{
                    borderTop: `2px ${['solid', 'dashed', 'dotted'][index] || 'solid'} ${series.c}`,
                  }}
                />
                {series.n}
              </span>
            ))}
            <span>
              <i style={{ borderTop: '2px dashed var(--gcr-ink)' }} />
              Total customers
            </span>
          </div>
          <table className="gcr-sr-only">
            <caption>30-day projection, cumulative new customers</caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                {projection.series.map((series) => (
                  <th scope="col" key={series.n}>
                    {series.n}
                  </th>
                ))}
                <th scope="col">Total</th>
                <th scope="col">Added recurring revenue</th>
              </tr>
            </thead>
            <tbody>
              {projection.labels.map((label, index) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {projection.series.map((series) => (
                    <td key={series.n}>{series.v[index]}</td>
                  ))}
                  <td>{projection.totals[index]}</td>
                  <td>{usd(projection.revenue[index])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="gcr-proj-side">
          <StatBox tone="violet" value={projection.totals[lastIndex]} label="Customers · day 30" />
          <StatBox tone="mint" value={usd(projection.revenue[lastIndex])} label="Added recurring revenue" />
          <StatBox tone="amber" value={data.summary.spend} label="Total spend" />
          <StatBox tone="sky" value={data.summary.cac} label="Blended CAC" />
          <p>
            <b>How GrowthCrew gets there —</b> paid channels ramp first, organic compounds from week
            three, and outbound fills the gap on days where paid frequency drops.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function PlanPanel({ data }) {
  return (
    <Panel
      icon={Rocket}
      title="The 30-day action plan"
      sub="What the agents do, week by week — nothing here needs you to write a thing"
      className="is-wide"
    >
      <div className="gcr-plan">
        {data.plan.map((week) => (
          <div className="gcr-week" key={week.w}>
            <p className="gcr-week-head">{week.w}</p>
            <div className="gcr-week-items">
              {week.items.map((item) => {
                const Icon = AGENT_ICONS[item.ag] || Sparkles;
                return (
                  <div className="gcr-plan-item" key={`${item.ag}-${item.b}`}>
                    <span className={`gcr-agent-badge is-${AGENT_COLORS[item.ag]}`}>
                      <Icon size={11} aria-hidden="true" />
                      {AGENT_LABELS[item.ag] || 'Agent'}
                    </span>
                    <p>
                      <b>{item.b}</b>
                      {item.t}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AutomationsPanel({ data, datasetKey }) {
  const [overrides, setOverrides] = useState({});

  return (
    <Panel
      icon={ShieldCheck}
      title="Automations ready to switch on"
      sub="Nothing that costs money runs without your approval"
    >
      <div className="gcr-toggles">
        {data.toggles.map((toggle, index) => {
          const id = `${datasetKey}-${index}`;
          const checked = overrides[id] ?? toggle.on;
          return (
            <div className="gcr-toggle-row" key={toggle.t}>
              <span className="gcr-toggle-icon">
                <Check size={16} aria-hidden="true" />
              </span>
              <div className="gcr-toggle-copy">
                <b>{toggle.t}</b>
                <span>{toggle.s}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={toggle.t}
                className={`gcr-switch${checked ? ' is-on' : ''}`}
                onClick={() => setOverrides((current) => ({ ...current, [id]: !checked }))}
              >
                <span aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
      <div className="gcr-pills">
        <span className="gcr-pill is-mint">
          <ShieldCheck size={13} aria-hidden="true" /> 3 spend approvals waiting
        </span>
        <span className="gcr-pill">
          <Clock3 size={13} aria-hidden="true" /> First post scheduled for tomorrow 09:00
        </span>
      </div>
    </Panel>
  );
}

export default function DemoReport({ initialKey = 'gym' }) {
  const [datasetKey, setDatasetKey] = useState(
    DATASET_KEYS.includes(initialKey) ? initialKey : DATASET_KEYS[0],
  );
  const data = DEMO_DATA[datasetKey];

  return (
    <div className="gcr-root">
      <div className="gcr-console">
        <div className="gcr-console-bar">
          <span className="gcr-console-title">
            <Layers size={16} aria-hidden="true" />
            GrowthCrew / example report
          </span>
          <span className="gcr-example-badge">
            <Globe2 size={12} aria-hidden="true" />
            Sample business · sample data
          </span>
        </div>
        <div className="gcr-context">
          <div className="gcr-context-brand">
            <b>{data.brand}</b>
            <span>{data.site}</span>
          </div>
          <div className="gcr-context-pills">
            <span className="gcr-pill is-violet">{data.industry}</span>
            <span className="gcr-pill">{data.offer}</span>
            <span className="gcr-pill is-mint">
              <Check size={12} aria-hidden="true" /> Report complete
            </span>
          </div>
          <div className="gcr-dots" role="group" aria-label="Choose an example business">
            {DATASET_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                className="gcr-dot"
                aria-pressed={key === datasetKey}
                aria-label={`Show ${DEMO_DATA[key].brand} example`}
                title={DEMO_DATA[key].brand}
                onClick={() => setDatasetKey(key)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="gcr-body" key={datasetKey}>
        <div className="gcr-context-grid">
          <div className="gcr-context-head">
            <span className="gcr-pill is-violet">
              <Layers size={13} aria-hidden="true" /> Context brief — read by all five agents
            </span>
            <span>
              Built from the prompt + {data.site} + 42 pages + competitors + reviews
            </span>
          </div>
          <div className="gcr-context-items">
            {data.context.map((item) => (
              <div key={item}>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="gcr-stat-strip">
          <StatBox tone="violet" value={data.summary.customers} label="New customers · 30 days" />
          <StatBox tone="mint" value={data.summary.mrr} label="Added monthly revenue" />
          <StatBox tone="amber" value={data.summary.cac} label="Blended CAC" />
          <StatBox tone="sky" value={data.summary.spend} label="Total ad spend" />
          <StatBox value={data.summary.saved} label="Your hours saved" />
        </div>

        <div className="gcr-grid">
          <ScorePanel data={data} />
          <AgentsPanel data={data} />
          <FindingsPanel data={data} count={data.findings.length} />
          <SeoPanel data={data} />
          <SocialPanel data={data} />
          <AdsPanel data={data} />
          <InfluencerPanel data={data} />
          <FunnelPanel data={data} />
          <ProjectionPanel data={data} />
          <PlanPanel data={data} />
          <AutomationsPanel data={data} datasetKey={datasetKey} />
        </div>

        <p className="gcr-disclaimer">
          <Sparkles size={13} aria-hidden="true" />
          This is an example report for a fictional business. Numbers are illustrative, not a
          promise of results. Lead Gen and Social Studio are live today; SEO, Influencers, Paid ads and
          Reports are on the roadmap.
        </p>
      </div>
    </div>
  );
}
