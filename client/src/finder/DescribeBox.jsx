import React, { useId, useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function DescribeBox({
  initialDescribe = '',
  busy = false,
  onSubmit,
  compact = false,
}) {
  const id = useId();
  const [describe, setDescribe] = useState(initialDescribe);
  const [website, setWebsite] = useState('');
  const [showWebsite, setShowWebsite] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    const clean = describe.trim();
    if (clean.length < 3 || busy) return;
    onSubmit(clean, website.trim());
  };

  return (
    <form className={`gc-describe${compact ? ' gc-describe-compact' : ''}`} data-ui onSubmit={submit}>
      <label className="gc-ui-label" htmlFor={`${id}-describe`}>
        Who are you looking for?
      </label>
      <div className="gc-describe-row">
        <input
          ref={(node) => {
            if (!compact && node) node.dataset.heroInput = 'true';
          }}
          id={`${id}-describe`}
          className="gc-ui-input gc-describe-input"
          value={describe}
          minLength={3}
          maxLength={200}
          autoComplete="off"
          placeholder="dentists in Pune"
          onChange={(event) => setDescribe(event.target.value)}
        />
        <button
          type="submit"
          className="gc-btn gc-btn-accent gc-btn-lg gc-find-button"
          disabled={busy || describe.trim().length < 3}
        >
          {busy ? 'Searching…' : 'Find people'}
          {!busy && <ArrowRight size={18} aria-hidden="true" />}
        </button>
      </div>

      {showWebsite ? (
        <div className="gc-website-field">
          <label className="gc-ui-label" htmlFor={`${id}-website`}>
            Your website <span className="gc-ui-dim">— optional</span>
          </label>
          <input
            id={`${id}-website`}
            className="gc-ui-input"
            type="url"
            inputMode="url"
            value={website}
            placeholder="https://yourbusiness.com"
            onChange={(event) => setWebsite(event.target.value)}
          />
          <p className="gc-ui-note">This helps us work out what you sell.</p>
        </div>
      ) : (
        <button type="button" className="gc-text-button" onClick={() => setShowWebsite(true)}>
          + Add your website
        </button>
      )}
    </form>
  );
}
