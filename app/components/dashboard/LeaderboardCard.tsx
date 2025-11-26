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
        // ignore errors
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
    <div
      className="
        bg-white/5 backdrop-blur-xl
        border border-white/10
        rounded-2xl p-4
        shadow-2xl shadow-black/70
        text-white
      "
    >
      {/* Period Tabs */}
      <div className="flex mb-3 rounded-full bg-black/60 border border-white/10 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPeriod(tab.key)}
            className={`
              flex-1 rounded-full text-xs py-1 transition
              ${
                period === tab.key
                  ? 'bg-white/10 backdrop-blur-xl border border-white/10 shadow-md text-white font-semibold'
                  : 'text-white/60 hover:bg-white/5'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-center text-white/70">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-center text-white/60">
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
                className={`
                  flex justify-between items-center rounded-xl px-3 py-2
                  ${
                    isMe
                      ? 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-md text-white font-semibold'
                      : 'bg-black/60 text-white'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 text-center text-lg">
                    {medal || idx + 1}
                  </span>

                  <div className="flex items-center gap-1">
                    {isMe && (
                      <span className="text-lime-400 text-sm leading-none">
                        ★
                      </span>
                    )}
                    <span className={isMe ? 'font-semibold' : ''}>
                      {e.username}
                    </span>
                  </div>
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
