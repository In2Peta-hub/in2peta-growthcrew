import React, { useId, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Mail } from 'lucide-react';
import { requestSignIn, setSession, verifySignIn } from './finder/finderApi';

// Same switch finderApi uses. Sample mode has no inbox to check, so we sign straight in.
const sampleMode = () =>
  import.meta.env.VITE_FINDER_MOCK === '1' || localStorage.getItem('gc_finder_mock') === '1';

export default function LoginPage({ notice = '', onSignedIn, onBack }) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('form'); // 'form' | 'sent'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sample = sampleMode();

  const submit = async (event) => {
    event.preventDefault();
    const clean = email.trim();
    if (!clean || busy) return;
    setBusy(true);
    setError('');
    try {
      if (sample) {
        const { account, token } = await verifySignIn(clean, 'sample');
        setSession(account?.email || clean, token);
        onSignedIn?.(account);
        return;
      }
      await requestSignIn(clean);
      setStep('sent');
    } catch (err) {
      setError(err?.message || 'Something went wrong. Try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  const useDifferentEmail = () => {
    setStep('form');
    setError('');
  };

  return (
    <div className="fn-login">
      <header className="fn-login-top">
        <span className="fn-wordmark" aria-label="GrowthCrew">
          <img className="brand-logo" src="/brand/in2peta-logo.png" alt="" width="36" height="36" />
          <span className="fn-wordmark-text">GrowthCrew</span>
        </span>
        {onBack && (
          <button type="button" onClick={onBack} className="ui-btn ui-btn-ghost ui-btn-sm">
            <ArrowLeft aria-hidden="true" />
            Back
          </button>
        )}
      </header>

      <main className="fn-login-main">
        <div className="fn-login-card ui-view" key={step}>
          {step === 'form' ? (
            <>
              <h1 className="ui-title fn-login-title">Sign in</h1>
              <p className="ui-sub fn-login-sub">
                Enter your email and we will send you a link. No password.
              </p>

              {notice && <p className="fn-notice" role="status">{notice}</p>}

              <form onSubmit={submit} className="fn-login-form">
                <div>
                  <label className="ui-label" htmlFor={`${id}-email`}>Email</label>
                  <input
                    id={`${id}-email`}
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                    className="ui-input"
                    aria-describedby={error ? `${id}-error` : undefined}
                  />
                </div>

                {error && <p id={`${id}-error`} className="fn-error" role="alert">{error}</p>}

                <button type="submit" disabled={busy || !email.trim()} className="ui-btn ui-btn-primary ui-btn-lg ui-btn-block">
                  {busy ? (
                    <>
                      <Loader2 className="ui-spin" aria-hidden="true" />
                      {sample ? 'Signing in' : 'Sending'}
                    </>
                  ) : sample ? (
                    <>
                      Sign in
                      <ArrowRight aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      Email me a sign-in link
                      <ArrowRight aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>

              {sample && (
                <p className="ui-hint fn-login-sample">
                  Sample mode: nothing is emailed and the people you see are made up.
                </p>
              )}
            </>
          ) : (
            <>
              <span className="fn-login-icon" aria-hidden="true"><Mail /></span>
              <h1 className="ui-title fn-login-title">Check your inbox</h1>
              <p className="ui-sub fn-login-sub" role="status">
                If there is an account for <strong className="fn-strong">{email.trim()}</strong>, a sign-in link is on its way.
                It works for 30 minutes.
              </p>
              <p className="ui-hint">
                Nothing yet? Look in spam. New here? Start with a search instead.
              </p>
              {onBack && (
                <button type="button" onClick={onBack} className="ui-btn ui-btn-block">
                  Start a search
                </button>
              )}
              <button type="button" onClick={useDifferentEmail} className="ui-btn ui-btn-ghost ui-btn-block">
                Use a different email
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
