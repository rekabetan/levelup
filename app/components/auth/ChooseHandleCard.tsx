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
        const updated: UserLike = {
          id: data.id,
          username: data.username,
          handle: data.handle,
        };
        localStorage.setItem('levelup_user', JSON.stringify(updated));
        window.location.reload();
      }
    } catch {
      setStatus('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-black border border-lime-400/30 rounded-2xl p-5 shadow-[0_0_18px_-4px_rgba(192,255,0,0.25)] space-y-4">
      <h2 className="text-xl font-bold text-center text-white tracking-tight">
        Choose your LevelUp name
      </h2>

      <p className="text-xs text-center text-white/60">
        This is how you’ll appear on the leaderboard.
      </p>

      <form onSubmit={submitHandle} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-white/60">Username</label>

          <div className="flex items-center gap-2">
            <span className="text-white/50 text-sm">@</span>

            <input
              className="
                flex-1 rounded-xl 
                border border-white/10 
                bg-neutral-900 
                px-3 py-2 
                text-sm text-white
                placeholder-white/30
                focus:border-lime-400 focus:outline-none
              "
              placeholder="yourname"
              value={handle}
              onChange={e => setHandle(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="
            w-full rounded-xl 
            bg-lime-400 text-black font-semibold 
            py-2 text-sm 
            shadow-md shadow-lime-400/20
            active:scale-95 
            disabled:opacity-50
          "
        >
          {loading ? 'Saving…' : 'Save Username'}
        </button>

        {status && (
          <p className="text-xs text-center text-red-400">{status}</p>
        )}
      </form>
    </div>
  );
}
