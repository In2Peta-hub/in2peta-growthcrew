import React, { useId, useState } from 'react';
import {
  createAccount,
  requestSignIn,
  savePendingPreview,
  setSession,
} from './finderApi';

export default function SaveStep({ preview, onSignedIn }) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!preview?.previewId || state === 'saving') return;

    savePendingPreview(preview);
    setState('saving');
    setMessage('');

    try {
      const result = await createAccount(email.trim(), preview.previewId);
      setSession(email.trim(), result.token);
      setState('saved');
      onSignedIn?.(result.account);
    } catch (error) {
      if (error?.status === 409) {
        try {
          await requestSignIn(email.trim());
          setState('link-sent');
          setMessage('We emailed you a sign-in link.');
          return;
        } catch (signInError) {
          setState('error');
          setMessage(signInError?.message || 'We could not send the sign-in link. Please try again.');
          return;
        }
      }
      if (error?.status === 429) {
        setMessage('Too many attempts for now. Please wait a little and try again.');
      } else {
        setMessage(error?.message || 'We could not save these leads. Please try again.');
      }
      setState('error');
    }
  };

  return (
    <section className="gc-save">
      <div>
        <h2>Keep these and get 10 more every week</h2>
        <p>Save this list with your email. New people arrive every Monday.</p>
      </div>
      {state === 'link-sent' || state === 'saved' ? (
        <p className="gc-save-confirmation" role="status">
          {message || 'Your leads are saved.'}
        </p>
      ) : (
        <form className="gc-save-form" data-ui onSubmit={submit}>
          <label className="gc-ui-label" htmlFor={`${id}-email`}>Your email</label>
          <div className="gc-save-row">
            <input
              id={`${id}-email`}
              className="gc-ui-input"
              type="email"
              autoComplete="email"
              required
              value={email}
              placeholder="you@company.com"
              onChange={(event) => setEmail(event.target.value)}
            />
            <button type="submit" className="gc-btn gc-btn-accent" disabled={state === 'saving'}>
              {state === 'saving' ? 'Saving…' : 'Save my leads'}
            </button>
          </div>
          {message && <p className="gc-form-error" role="alert">{message}</p>}
        </form>
      )}
    </section>
  );
}
