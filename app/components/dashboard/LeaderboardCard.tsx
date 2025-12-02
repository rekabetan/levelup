// components/dashboard/LeaderboardCard.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Period } from '@/lib/types';
import { formatMinutesAsHoursLabel } from '@/app/components/goal/SetWeeklyGoalSheet';
import Card from '@/components/ui/Card';
import { List, ListItem } from '@/components/ui/List';

type LeaderboardCardProps = {
  currentUser: string;
};

type User = {
  id: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  handle?: string | null;
  role?: string | null; // optional – may or may not be present
};

type LeaderboardEntry = {
  id: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  total_minutes: number;
};

function formatShortName(user: User) {
  const first = user.first_name?.trim();
  const lastInitial = user.last_name?.trim()?.charAt(0);

  if (first) {
    return lastInitial ? `${first} ${lastInitial.toUpperCase()}` : first;
  }

  const parts = user.username?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return user.username;

  const derivedFirst = parts[0];
  const derivedLastInitial =
    parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';

  return derivedLastInitial
    ? `${derivedFirst} ${derivedLastInitial.toUpperCase()}`
    : derivedFirst;
}

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
          setEntries(([]) as LeaderboardEntry[]);
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

  // Prefer players, fall back to all users if roles/players not present
  const hasRoleInfo = users.some((u) => typeof u.role === 'string');
  const hasPlayers = users.some((u) => u.role === 'player');

  const effectiveUsers: User[] =
    hasRoleInfo && hasPlayers ? users.filter((u) => u.role === 'player') : users;

  // Merge: every effective user gets a row; minutes from entries if present, else 0
  const entryById = new Map(entries.map((e) => [e.id, e]));

  const rows = effectiveUsers
    .map((u) => {
      const match = entryById.get(u.id);
      return {
        id: u.id,
        username: u.username,
        handle: u.handle ?? null,
        displayName: formatShortName(u) || u.username,
        total_minutes: match?.total_minutes ?? 0,
      };
    })
    .sort((a, b) => {
      if (b.total_minutes !== a.total_minutes) {
        return b.total_minutes - a.total_minutes;
      }
      return a.displayName.localeCompare(b.displayName);
    });

  return (
    <Card title="Leaderboard">
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
          No players to display.
        </p>
      ) : (
        <List>
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
            const slug = e.handle
              ? e.handle.replace(/^@/, '')
              : e.id;
            const profileHref = `/${encodeURIComponent(slug)}`;

            return (
              <ListItem key={e.id} className="items-center gap-2">
                {/* Medal / Rank OUTSIDE the box */}
                <span className="w-6 text-center text-xl">
                  {medal || idx + 1}
                </span>

                {/* Clickable pill/box linking to that player's profile */}
                <Link href={profileHref} className="flex-1">
                  <div className="flex justify-between items-center flex-1 cursor-pointer px-3">
                    {/* Name + "me" star */}
                    <div className="flex items-center gap-1">
                      {isMe && (
                        <span className="text-lime-400 text-sm leading-none">
                          ★
                        </span>
                      )}
                      <span className={isMe ? 'font-semibold' : ''}>
                        {e.displayName}
                      </span>
                    </div>

                    {/* Minutes formatted as hours + minutes */}
                    <span className="text-sm font-semibold">
                      {formatMinutesAsHoursLabel(e.total_minutes)}
                    </span>
                  </div>
                </Link>
              </ListItem>
            );
          })}
        </List>
      )}
    </Card>
  );
}
