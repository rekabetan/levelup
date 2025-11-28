// app/profile/ProfileClient.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { User, LogEntry } from '@/lib/types';
import { computeWeeklyStreak, getWeekStart } from '@/lib/streak';
import ProfileAvatar from '@/app/components/profile/ProfileAvatar';

type ProfileContentProps = {
  user: User;
  logs: LogEntry[];
  loadingLogs: boolean;
};

function ProfileContent({ user, logs, loadingLogs }: ProfileContentProps) {
  const now = new Date();

  // ---------- Streak / Recent ----------
  const weeklyStreak = computeWeeklyStreak(logs);

  const weekStartMs = getWeekStart(now);
  const recentLogs = logs
    .filter((log) => new Date(log.created_at).getTime() >= weekStartMs)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const formatLogDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  // ---------- Monthly calendar data ----------
  const [viewYear, setViewYear] = useState(() => now.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => now.getMonth()); // 0 = Jan

  const year = viewYear;
  const month = viewMonth;

  const firstOfMonth = new Date(year, month, 1);
  const monthName = firstOfMonth.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const startWeekday = firstOfMonth.getDay(); // 0-6
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const todayDate = now.getDate();
  const isViewingCurrentMonth =
    viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const minutesByDate: Record<string, number> = {};
  for (const log of logs) {
    const d = new Date(log.created_at);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      minutesByDate[key] = (minutesByDate[key] || 0) + log.minutes;
    }
  }

  type CalendarCell =
    | {
        day: number;
        key: string;
        hasEnough: boolean;
        isToday: boolean;
      }
    | null;

  const calendarCells: CalendarCell[] = [];

  for (let i = 0; i < startWeekday; i++) {
    calendarCells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const key = dateObj.toISOString().slice(0, 10);
    const totalMinutes = minutesByDate[key] || 0;
    const hasEnough = totalMinutes >= 15;
    const isToday = isViewingCurrentMonth && day === todayDate;

    calendarCells.push({ day, key, hasEnough, isToday });
  }

  const goToPreviousMonth = () => {
    const prev = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(prev.getFullYear());
    setViewMonth(prev.getMonth());
  };

  const goToNextMonth = () => {
    const next = new Date(viewYear, viewMonth + 1, 1);
    const currentMonthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );
    if (next > currentMonthStart) return;
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const resetToCurrentMonth = () => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const isAtCurrentMonth =
    viewYear === now.getFullYear() && viewMonth === now.getMonth();

  // ---------- Render ----------
  return (
    <main className="flex-1 w-full px-6 py-6 max-w-lg mx-auto space-y-10">
      {/* Avatar / Name */}
      <section className="flex flex-col items-center text-center relative">
        <div className="relative mb-6">
          <ProfileAvatar
            user={user}
            weeklyStreak={weeklyStreak}
            size="lg"
            showBadge={true}
          />
        </div>

        <div className="flex flex-col items-center space-y-1 mb-2">
          <p className="text-4xl font-semibold">{user.username}</p>
          {user.handle && (
            <p className="text-lg text-white/60">@{user.handle}</p>
          )}
        </div>
      </section>

      {/* RECENT */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-3xl font-bold text-white">Recent</h2>
          <Link
            href="/logs"
            className="text-sm font-semibold text-lime-400 hover:text-lime-300"
          >
            Show more →
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
          {loadingLogs ? (
            <p className="text-base text-white/60">
              Loading this week&apos;s activity…
            </p>
          ) : recentLogs.length === 0 ? (
            <p className="text-base text-white/60">No logs yet this week.</p>
          ) : (
            <ul className="space-y-3">
              {recentLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-start justify-between gap-3 border-b border-white/5 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-white/60">
                      {formatLogDate(log.created_at)}
                    </span>
                    {log.category && (
                      <span className="text-sm font-medium text-white/80 mt-0.5">
                        {log.category}
                      </span>
                    )}
                    {log.comment && (
                      <span className="text-sm text-white/70 mt-0.5">
                        {log.comment}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold">
                      {log.minutes} min
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* HISTORY / CALENDAR */}
      <section>
        {/* Title + controls stacked (your layout) */}
        <div className="mb-3">
          <h2 className="text-3xl font-bold text-white">History</h2>

          <div className="mt-2 flex items-center justify-end gap-2 text-sm font-semibold text-white/70">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="w-7 h-7 flex items-center justify-center rounded-full border border-white/20 hover:bg-white/10 hover:text-white transition"
            >
              ‹
            </button>

            <span className="min-w-[140px] text-center text-white/80">
              {monthName}
            </span>

            <button
              type="button"
              onClick={goToNextMonth}
              disabled={isAtCurrentMonth}
              className={`
                w-7 h-7 flex.items-center justify-center rounded-full border border-white/20 transition
                ${
                  isAtCurrentMonth
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-white/10 hover:text-white'
                }
              `}
            >
              ›
            </button>

            <button
              type="button"
              onClick={resetToCurrentMonth}
              disabled={isAtCurrentMonth}
              className={`
                ml-1 px-3 py-1 rounded-full border border-white/20 text-xs font-medium transition
                ${
                  isAtCurrentMonth
                    ? 'opacity-30 cursor-not-allowed text-white/40'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }
              `}
            >
              Today
            </button>
          </div>
        </div>

        {/* Calendar card */}
        <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
          {loadingLogs ? (
            <p className="text-base text-white/60">
              Loading this month&apos;s activity…
            </p>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-2 mb-3 text-center text-sm font-medium text.white/60">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              <div className="grid grid-cols-7 gap-2 text-base">
                {calendarCells.map((cell, idx) => {
                  if (!cell) return <div key={idx} className="h-10" />;

                  const { day, hasEnough, isToday } = cell;
                  const base =
                    'flex items-center justify-center h-10 w-10 rounded-full mx-auto font-semibold transition';

                  const highlight = hasEnough
                    ? 'outline outline-2 outline-lime-400'
                    : 'bg-zinc-900 text-white/80';

                  const todayState = isToday
                    ? 'bg-lime-400 text-black'
                    : '';

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-center"
                    >
                      <div className={`${base} ${highlight} ${todayState}`}>
                        {day}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default function ProfileClient() {
  const searchParams = useSearchParams();
  const viewedUserId = searchParams.get('id'); // ?id=... when tapped from leaderboard

  const [selfUser, setSelfUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // ---------- Load logged-in user from localStorage ----------
  useEffect(() => {
    const stored = localStorage.getItem('levelup_user');
    if (!stored) {
      setSelfUser(null);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as User;
      setSelfUser(parsed);
    } catch {
      console.error('Failed to parse levelup_user from localStorage');
      localStorage.removeItem('levelup_user');
      setSelfUser(null);
    }
  }, []);

  // ---------- Load the user whose profile we're viewing ----------
  useEffect(() => {
    async function loadUser() {
      try {
        setUserLoaded(false);

        if (viewedUserId) {
          // Viewing someone specific via ?id=...
          const res = await fetch('/api/users');
          if (!res.ok) {
            console.error(
              'Error from /api/users:',
              res.status,
              await res.text()
            );
            setViewUser(null);
          } else {
            const data = await res.json();
            const users = (data.users || []) as User[];
            const found = users.find((u) => u.id === viewedUserId) || null;
            setViewUser(found);
          }
        } else {
          // Viewing own profile, no ?id=...
          const stored = localStorage.getItem('levelup_user');
          if (!stored) {
            setViewUser(null);
          } else {
            try {
              const parsed = JSON.parse(stored) as User;
              setViewUser(parsed);
            } catch {
              console.error('Failed to parse levelup_user for viewUser');
              localStorage.removeItem('levelup_user');
              setViewUser(null);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load profile user', err);
        setViewUser(null);
      } finally {
        setUserLoaded(true);
      }
    }

    loadUser();
  }, [viewedUserId]);

  // ---------- Load logs for the viewed user ----------
  useEffect(() => {
    if (!viewUser) return;
    const userId = viewUser.id;

    async function loadLogs() {
      try {
        setLoadingLogs(true);
        const res = await fetch(`/api/logs?userId=${userId}`);
        if (!res.ok) {
          console.error(
            'Error from /api/logs:',
            res.status,
            await res.text()
          );
          setLogs([]);
          return;
        }
        const data = await res.json();
        setLogs((data.logs || []) as LogEntry[]);
      } catch (err) {
        console.error('Failed to load logs for profile', err);
        setLogs([]);
      } finally {
        setLoadingLogs(false);
      }
    }

    loadLogs();
  }, [viewUser?.id]);

  // ---------- Early returns ----------
  if (!userLoaded) return null;

  if (!viewUser) {
    const message = viewedUserId
      ? 'User not found.'
      : "You’re not signed in.";

    return (
      <div className="min-h-screen bg-black text.white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg">{message}</p>
          <Link
            href="/"
            className="inline-flex items-center.rounded-full border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/10 transition"
          >
            ← Back to LevelUp
          </Link>
        </div>
      </div>
    );
  }

  const hasLoggedInUser = !!selfUser;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 w-full py-4 bg-black/80 backdrop-blur border-b border-white/10 shadow flex items-center justify-between px-4">
        {/* Back button */}
        <Link
          href="/"
          className="text-sm text-white/70 hover:text-white flex.items-center gap-1"
        >
          <span className="text-lg">←</span>
          <span>Back</span>
        </Link>

        <h1 className="text-lg font-semibold tracking-tight">Profile</h1>

        {/* Show Sign Out whenever there *is* a.logged-in user */}
        {hasLoggedInUser ? (
          <button
            onClick={() => {
              localStorage.removeItem('levelup_user');
              window.location.href = '/';
            }}
            className="
              text-xs font-medium 
              px-3 py-1.5 
              rounded-lg 
              border border-white/20 
              text-white/80 
              hover:text-white hover:bg-white/10 
              transition
            "
          >
            Sign Out
          </button>
        ) : (
          <div className="w-[72px]" />
        )}
      </header>

      <ProfileContent
        user={viewUser}
        logs={logs}
        loadingLogs={loadingLogs}
      />
    </div>
  );
}
