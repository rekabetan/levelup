// components/dashboard/LeaderboardCard.tsx
'use client';

import { useEffect, useState } from 'react';
import type { Period } from '@/lib/types';
import { formatMinutesAsHoursLabel } from '@/components/goal/SetWeeklyGoalSheet';

type LeaderboardCardProps = {
  currentUser: string;
};

type User = {
  id: string;
  username: string;
};

type LeaderboardEntry = {
  username: string;
  total_minutes: number;
};

export default function LeaderboardCard({ currentUser }: LeaderboardCardProps) {
  const [period, setPeriod] = useState<Period>('week');
  const [users, setUsers] = useState<User[]>([]);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [usersRes, leaderboardRes] = await Promise.all([
          fetch('/api/users'),
          fetch(`/api/leaderboard?period=${period}`),
        ]);

        // USERS
        if (!usersRes.ok) {
          const text = await usersRes.text();
          console.error('Error from /api/users:', usersRes.status, text);
          setUsers([]);
        } else {
          const usersData = await usersRes.json();
          setUsers((usersData.users || []) as User[]);
        }

        // LEADERBOARD ENTRIES
        if (!leaderboardRes.ok) {
          const text = await leaderboardRes.text();
          console.error(
            'Error from /api/leaderboard:',
            leaderboardRes.status,
            text
          );
          setEntries([]);
        } else {
          const leaderboardData = await leaderboardRes.json();
          setEntries((leaderboardData.entries || []) as LeaderboardEntry[]);
        }
      } catch (err) {
        console.error('Error loading leaderboard:', err);
        setUsers([]);
        setEntries([]);
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

  // Merge: every user gets a row; minutes from entries if present, else 0
  const rows = users
    .map((u) => {
      const match = entries.find((e) => e.username === u.username);
      return {
        id: u.id,
        username: u.username,
        total_minutes: match?.total_minutes ?? 0,
      };
    })
    .sort((a, b) => {
      if (b.total_minutes !== a.total_minutes) {
        return b.total_minutes - a.total_minutes;
      }
      return a.username.localeCompare(b.username);
    });

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
      {/* Title */}
      <p className="text-xl font-bold uppercase tracking-wide mb-3 text-center w-full">
        Leaderboard
      </p>

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
      ) : rows.length === 0 ? (
        <p className="text-sm text-center text-white/60">
          No users to display.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((e, idx) => {
            const isMe = e.username === currentUser;
            const medal =
              idx === 0
                ? '🥇'
                : idx === 1
                ? '🥈'
                : idx === 2
                ? '🥉'
                : '';

            return (
              <li
                key={e.id}
                className="flex items-center gap-2"
              >
                {/* Medal / Rank OUTSIDE the box */}
                <span className="w-6 text-center text-xl">
                  {medal || idx + 1}
                </span>

                {/* Inner pill/box with user + minutes */}
                <div
                  className={`
                    flex justify-between items-center flex-1
                    rounded-xl px-3 py-2
                    ${
                      isMe
                        ? 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-md text-white font-semibold'
                        : 'border border-white/15 text-white'
                    }
                  `}
                >
                  {/* Name + "me" star */}
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

                  {/* Minutes formatted as hours + minutes */}
                  <span className="text-sm font-semibold">
                    {formatMinutesAsHoursLabel(e.total_minutes)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
