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
          handle: data.handle ?? null,
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
      <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-2xl">
        {/* Title */}
        <h2 className="text-2xl font-bold mb-3 text-center text-white">
          Sign In
        </h2>
        <p className="text-xs text-white/50 text-center mb-4">
          Enter your name, then your secret PIN.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Player Name */}
          <div className="space-y-1">
            <label className="text-xs text-white/60">
              {stage === 'username' ? 'Player Name' : 'Player Name (locked)'}
            </label>
            <input
              className="
                w-full rounded-xl border border-white/10 
                bg-zinc-900 px-3 py-2 text-white 
                focus:outline-none focus:ring-2 focus:ring-lime-400 
                disabled:opacity-60
              "
              placeholder="e.g., Brooks"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={stage === 'pin'}
            />
          </div>

          {/* PIN */}
          {stage === 'pin' && (
            <div className="space-y-1">
              <label className="text-xs text-white/60">PIN</label>
              <input
                className="
                  w-full rounded-xl border border-white/10 
                  bg-zinc-900 px-3 py-2 text-white
                  focus:outline-none focus:ring-2 focus:ring-lime-400
                "
                placeholder="4-digit PIN"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={e => setPin(e.target.value)}
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
                  bg-black text-white/80 py-2 text-sm
                  hover:text-white hover:bg-white/10 transition
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
                py-2 text-sm shadow-md active:scale-95 transition
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

          {/* Error message */}
          {status && (
            <p className="text-sm text-center text-red-400">{status}</p>
          )}
        </form>
      </div>
    </div>
  );
}
