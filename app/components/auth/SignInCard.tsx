// app/components/auth/SignInCard.tsx
'use client';

import { useState } from 'react';
import type { User } from '@/lib/types';

type SignInCardProps = {
  onSignedIn: (u: User) => void;
};

export default function SignInCard({ onSignedIn }: SignInCardProps) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [stage, setStage] = useState<'username' | 'pin'>('username');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    // STEP 1: check username
    if (stage === 'username') {
      if (!username.trim()) {
        setStatus('Please enter your name.');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/login/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });

        const data = await res.json();
        if (!res.ok) {
          setStatus(data.error || 'Could not find that player.');
        } else {
          setStage('pin');
          setStatus(null);
        }
      } catch {
        setStatus('Network error');
      } finally {
        setLoading(false);
      }

      return;
    }

    // STEP 2: check PIN + log in
    if (!pin.trim()) {
      setStatus('Please enter your PIN.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || 'Error logging in');
      } else {
        const user: User = {
          id: data.id,
          username: data.username,
          first_name: data.first_name ?? null,
          last_name: data.last_name ?? null,
          handle: data.handle ?? null,
          role: data.role ?? 'player',
          avatar_url: data.avatar_url ?? null,
          weekly_goal: data.weekly_goal ?? null,

          // 👇 these are what ProfileClient is reading
          team_name: data.team_name ?? null,
          organization_name: data.organization_name ?? null,
          team_age_group: data.team_age_group ?? null,
        };

        window.localStorage.setItem('levelup_user', JSON.stringify(user));
        onSignedIn(user);
      }
    } catch {
      setStatus('Network error');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setUsername('');
    setPin('');
    setStage('username');
    setStatus(null);
  }

  return (
    <div className="w-full max-w-xl mx-auto px-2">
      <div
        className="
          bg-black border border-lime-400/30 rounded-2xl p-6 
          shadow-[0_0_18px_-4px_rgba(192,255,0,0.25)]
        "
      >
        {/* Title */}
        <h2 className="text-2xl font-bold mb-3 text-center text-white">
          Sign In
        </h2>
        <p className="text-xs text-white/60 text-center mb-4">
          Enter your first name, then your secret PIN.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Player Name */}
          <div className="space-y-1">
            <label className="text-xs text-white/60">
              {stage === 'username'
                ? 'First Name'
                : 'Name (locked)'}
            </label>
            <input
              className="
                w-full rounded-xl 
                border border-white/10
                bg-neutral-900 
                px-3 py-2 text-white 
                placeholder-white/30
                focus:outline-none focus:border-lime-400
                disabled:opacity-50
              "
              placeholder="Enter your first name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={stage === 'pin'}
            />
          </div>

          {/* PIN */}
          {stage === 'pin' && (
            <div className="space-y-1">
              <label className="text-xs text-white/60">PIN</label>
              <input
                className="
                  w-full rounded-xl 
                  border border-white/10
                  bg-neutral-900 
                  px-3 py-2 text-white
                  placeholder-white/30
                  focus:outline-none focus:border-lime-400
                "
                placeholder="4-digit PIN"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            {stage === 'pin' && (
              <button
                type="button"
                onClick={reset}
                disabled={loading}
                className="
                  flex-1 rounded-xl border border-white/20
                  bg-black text-white/70 py-2 text-sm
                  hover:text-white hover:bg-white/10 
                  transition
                  disabled:opacity-50
                "
              >
                Back
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`
                ${stage === 'username' ? 'w-full' : 'flex-1'}
                rounded-xl bg-lime-400 text-black font-semibold 
                py-2 text-sm shadow-md shadow-lime-400/20
                active:scale-95 
                transition
                ${loading ? 'opacity-60' : 'hover:bg-lime-300'}
              `}
            >
              {loading
                ? stage === 'username'
                  ? 'Checking…'
                  : 'Signing in…'
                : stage === 'username'
                ? 'Next'
                : 'Continue'}
            </button>
          </div>

          {/* Error */}
          {status && (
            <p className="text-sm text-center text-red-400">{status}</p>
          )}
        </form>
      </div>
    </div>
  );
}
