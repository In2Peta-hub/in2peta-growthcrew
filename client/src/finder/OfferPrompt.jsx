// Asked once, inline, only while we don't know what the user sells. One
// sentence here turns every first message from a template into a real note.

import React, { useId, useState } from 'react';
import { setOffer } from './finderApi';

export default function OfferPrompt({ onSaved }) {
  const id = useId();
  const [offer, setOfferText] = useState('');
  const [state, setState] = useState('idle');

  const submit = async (event) => {
    event.preventDefault();
    if (offer.trim().length < 3 || state === 'saving') return;
    setState('saving');
    try {
      const res = await setOffer(offer.trim());
      setState('idle');
      onSaved(res.account);
    } catch {
      setState('error');
    }
  };

  return (
    <form className="ui-panel fn-offer" onSubmit={submit}>
      <label className="ui-panel-title fn-offer-q" htmlFor={`${id}-offer`}>What do you offer?</label>
      <p className="ui-sub">One sentence, and every first message we write will use it.</p>
      <div className="fn-offer-row">
        <input
          id={`${id}-offer`}
          className="ui-input"
          value={offer}
          maxLength={200}
          placeholder="We build websites for dental clinics"
          onChange={(event) => setOfferText(event.target.value)}
        />
        <button type="submit" className="ui-btn" disabled={state === 'saving' || offer.trim().length < 3}>
          {state === 'saving' ? 'Saving…' : 'Save'}
        </button>
      </div>
      {state === 'error' && <p className="fn-error" role="alert">That did not save. Try again.</p>}
    </form>
  );
}
