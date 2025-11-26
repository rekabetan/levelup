// app/components/auth/ChooseHandleCard.tsx
'use client';

import { useState, type FormEvent } from 'react';

type UserLike = {
  id: string;
  username: string;
  handle?: string | null;
};

type ChooseHandleCardProps = {
  user: UserLike;
};

export default function ChooseHandleCard({ user }: ChooseHandleCardProps) {
  const [handle, setHandle] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitHandle(e: FormEvent) {
    e.preventDefault();
    if (!handle.trim()) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/profile/handle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, handle }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || 'Error saving handle');
      } else {
        // Update local user in localStorage so refresh keeps it
        const updated: UserLike = {
          id: data.id,
          username: data.username,
          handle: data.handle,
        };
        localStorage.setItem('levelup_user', JSON.stringify(updated));
        // Hard reload to let Home re-read updated user
        window.location.reload();
      }
    } catch {
      setStatus('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-3">
      <h2 className="text-lg font-bold text-center">Choose your LevelUp name</h2>
      <p className="text-xs text-slate-300 text-center">
        This is how you&apos;ll show up on the leaderboard.
      </p>
      <form onSubmit={submitHandle} className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Username</label>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-sm">@</span>
            <input
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              placeholder="username"
              value={handle}
              onChange={e => setHandle(e.target.value)}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-lime-400 text-slate-950 font-semibold py-2 text-sm shadow-md active:scale-95 disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Save username'}
        </button>
        {status && (
          <p className="text-xs text-center text-red-300">{status}</p>
        )}
      </form>
    </div>
  );
}
