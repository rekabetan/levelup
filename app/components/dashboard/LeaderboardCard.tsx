// components/dashboard/LeaderboardCard.tsx
'use client';

import { useEffect, useState } from 'react';
import type { Entry, Period } from '@/lib/types';

type LeaderboardCardProps = {
  currentUser: string;
};

export default function LeaderboardCard({ currentUser }: LeaderboardCardProps) {
  const [period, setPeriod] = useState<Period>('week');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?period=${period}`);
        const data = await res.json();
        setEntries(data.entries || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [period]);

  const tabs: { key: Period; label: string }[] = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4 shadow-lg">
      <div className="flex mb-3 rounded-full bg-slate-950/70 border border-slate-700 p-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setPeriod(tab.key)}
            className={`flex-1 rounded-full text-xs py-1 ${
              period === tab.key
                ? 'bg-lime-400 text-slate-950 font-bold'
                : 'text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-center text-slate-300">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-center text-slate-400">
          No minutes logged yet. Be the first!
        </p>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {entries.map((e, idx) => {
            const isMe = e.username === currentUser;
            const medal =
              idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';

            return (
              <li
                key={e.username}
                className={`flex justify-between items-center rounded-xl px-3 py-2 border ${
                  isMe
                    ? 'border-lime-400 bg-slate-900'
                    : 'border-slate-700 bg-slate-950/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 text-center text-lg">
                    {medal || idx + 1}
                  </span>
                  <span className={isMe ? 'font-bold' : ''}>
                    {e.username}
                    {isMe && (
                      <span className="text-xs ml-1 text-lime-300">(You)</span>
                    )}
                  </span>
                </div>
                <span className="text-sm font-semibold">
                  {e.total_minutes} min
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
