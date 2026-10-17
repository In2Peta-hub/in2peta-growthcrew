import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage({ onLogin, onBack }) {
  const [email, setEmail] = useState('aarya@in2peta.com');
  const [password, setPassword] = useState('scalora2026');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      onLogin({
        email: 'aarya@in2peta.com',
        name: 'Aarya',
        initial: 'A',
        role: 'Creative Director',
      });
      setLoading(false);
    }, 400);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onLogin({
        email,
        name: 'Aarya',
        initial: 'A',
        role: 'Creative Director',
      });
      setLoading(false);
    }, 500);
  };

  const handleQuickDemo = () => {
    setLoading(true);
    setTimeout(() => {
      onLogin({
        email: 'aarya@in2peta.com',
        name: 'Aarya',
        initial: 'A',
        role: 'Creative Director',
      });
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[var(--ui-bg)] text-[var(--ui-ink)] grid lg:grid-cols-2">
      <div className="flex flex-col justify-between gap-12 p-6 sm:p-10">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-3">
            <img className="brand-logo !w-9 !h-9" src="/brand/in2peta-logo.png" alt="" width="36" height="36" />
            <span className="font-[family-name:var(--font-display)] text-[19px] font-bold tracking-tight">GrowthCrew</span>
          </span>
          {onBack && (
            <button type="button" onClick={onBack} className="ui-btn ui-btn-ghost ui-btn-sm">
              <ArrowLeft aria-hidden="true" />
              Back
            </button>
          )}
        </div>
        <div className="space-y-4 max-w-md">
          <h1 className="ui-title !text-[clamp(2.25rem,1.4rem+2.6vw,3.5rem)] !leading-[1] !tracking-[-0.035em]">
            Sign in to your workspace
          </h1>
          <p className="text-[17px] leading-relaxed text-[var(--ui-muted)]">
            Social Studio and Lead Gen share one account. Pick up where you left off.
          </p>
        </div>
        <p className="text-[13px] text-[var(--ui-faint)]">GrowthCrew, a product by In2Peta</p>
      </div>

      <div className="flex items-center justify-center bg-[var(--ui-surface)] p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6 ui-arrive">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="ui-btn ui-btn-light ui-btn-lg ui-btn-block"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-[13px] text-[var(--ui-faint)]">or sign in with email</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="ui-label" htmlFor="login-email">Work email</label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="ui-input"
              />
            </div>

            <div>
              <label className="ui-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ui-input"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--ui-muted)] select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              Keep me signed in
            </label>

            <button type="submit" disabled={loading} className="ui-btn ui-btn-primary ui-btn-lg ui-btn-block">
              {loading ? (
                <>
                  <Loader2 className="ui-spin" aria-hidden="true" />
                  Signing in
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <button type="button" onClick={handleQuickDemo} disabled={loading} className="ui-btn ui-btn-ghost ui-btn-block">
            Try the demo workspace
          </button>
        </div>
      </div>
    </div>
  );
}
