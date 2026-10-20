import React from 'react';

const understoodLine = (understood) => {
  if (!understood?.who) return null;
  return `Looking for ${understood.who}${understood.where ? ` · ${understood.where}` : ''}`;
};

const LeadCard = ({ lead, index }) => (
  <article className="gc-lead-card" style={{ '--i': index }}>
    <div className="gc-lead-card-top">
      <h3>{lead.name || lead.company}</h3>
      {lead.city && <span>{lead.city}</span>}
    </div>
    {(lead.role || lead.name) && (
      <p className="gc-lead-meta">
        {[lead.role, lead.name ? lead.company : null].filter(Boolean).join(' · ')}
      </p>
    )}
    <p className="gc-lead-why">{lead.why}</p>
  </article>
);

const Skeleton = ({ index }) => (
  <div className="gc-lead-skeleton" style={{ '--i': index }} aria-hidden="true">
    <span />
    <span />
    <span />
  </div>
);

export default function PreviewList({
  preview,
  status,
  error,
  elapsed = 0,
  onRetry,
  onSuggestion,
}) {
  if (status === 'idle') return null;

  const leads = preview?.leads || [];
  const understood = understoodLine(preview?.understood);
  const isRunning = status === 'running';

  return (
    <section className="gc-preview" aria-live="polite" aria-busy={isRunning}>
      {understood && <p className="gc-understood">{understood}</p>}

      {isRunning && (
        <p className="gc-progress">
          {elapsed < 12 ? 'Searching…' : 'Still looking. Live listings can take up to a minute.'}
          <span>{elapsed}s</span>
        </p>
      )}

      {status === 'failed' && (
        <div className="gc-state-message">
          <h2>We couldn’t finish that search</h2>
          <p>{error || 'Something went wrong. Your description is still here.'}</p>
          <button type="button" className="gc-btn gc-btn-dark" onClick={onRetry}>Try again</button>
        </div>
      )}

      {status === 'rate-limited' && (
        <div className="gc-state-message">
          <h2>Too many searches for now</h2>
          <p>We limit searches to keep live listings available. Please try again later.</p>
        </div>
      )}

      {status === 'empty' && (
        <div className="gc-state-message">
          <h2>No one matched that yet</h2>
          <p>Try a broader description:</p>
          <div className="gc-suggestions">
            {(preview?.suggestions || []).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="gc-suggestion"
                onClick={() => onSuggestion(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {(isRunning || status === 'done') && (
        <div className="gc-lead-list">
          {leads.map((lead, index) => <LeadCard key={lead.key} lead={lead} index={index} />)}
          {isRunning && Array.from({ length: Math.max(0, 5 - leads.length) }, (_, index) => (
            <Skeleton key={`skeleton-${index}`} index={leads.length + index} />
          ))}
        </div>
      )}
    </section>
  );
}
