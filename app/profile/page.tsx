// app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { User, LogEntry } from '@/lib/types';
import { computeWeeklyStreak } from '@/lib/streak';
import ProfileAvatar from '@/app/components/profile/ProfileAvatar';

export default function ProfilePage() {
  // ---------- Core state ----------
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Stable "now" value per render (fine to recompute)
  const now = new Date();

  // Calendar view state – MUST live above any early returns
  const [viewYear, setViewYear] = useState(() => now.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => now.getMonth()); // 0 = Jan

  // ---------- Effects ----------
  // Load user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('levelup_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('levelup_user');
      }
    }
    setLoaded(true);
  }, []);

  // Fetch logs for this user
  useEffect(() => {
    if (!user) return;

    const loadLogs = async () => {
      try {
        setLoadingLogs(true);
        const res = await fetch(`/api/logs?userId=${user.id}`);
        const data = await res.json();
        setLogs(data.logs || []);
      } catch (err) {
        console.error('Failed to load logs for profile', err);
      } finally {
        setLoadingLogs(false);
      }
    };

    loadLogs();
  }, [user?.id, user]);

  // ---------- Early returns (AFTER all hooks) ----------
  if (!loaded) return null;

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg">You&apos;re not signed in.</p>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/10 transition"
          >
            ← Back to LevelUp
          </Link>
        </div>
      </div>
    );
  }

  // ---------- Streak / Initial ----------
  const weeklyStreak = computeWeeklyStreak(logs);
  // const isOnActiveStreak = weeklyStreak > 0;

  // const initial =
  //   (user.username && user.username.trim()[0]?.toUpperCase()) ||
  //   (user.handle && user.handle.replace('@', '')[0]?.toUpperCase()) ||
  //   '?';

  // ---------- Monthly Calendar Data (based on viewYear/viewMonth) ----------
  const year = viewYear;
  const month = viewMonth;

  const firstOfMonth = new Date(year, month, 1);
  const monthName = firstOfMonth.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const startWeekday = firstOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const todayDate = now.getDate();
  const isViewingCurrentMonth =
    viewYear === now.getFullYear() && viewMonth === now.getMonth();

  // Aggregate total minutes per day for the viewed month
  const minutesByDate: Record<string, number> = {};
  for (const log of logs) {
    const d = new Date(log.created_at);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      minutesByDate[key] = (minutesByDate[key] || 0) + log.minutes;
    }
  }

  // Build calendar cells (includes leading blanks)
  type CalendarCell = {
    day: number;
    key: string;
    hasEnough: boolean;
    isToday: boolean;
  } | null;

  const calendarCells: CalendarCell[] = [];

  // Leading empty cells before day 1
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

  // ---------- Month Navigation Handlers ----------
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
    if (next > currentMonthStart) return; // don’t go into the future
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
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 w-full py-4 bg-black/80 backdrop-blur border-b border-white/10 shadow flex items-center justify-between px-4">
        {/* Back button */}
        <Link
          href="/"
          className="text-sm text-white/70 hover:text-white flex items-center gap-1"
        >
          <span className="text-lg">←</span>
          <span>Back</span>
        </Link>

        {/* Title */}
        <h1 className="text-lg font-semibold tracking-tight">Profile</h1>

        {/* Sign Out button */}
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
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full px-6 py-6 max-w-lg mx-auto space-y-10">
        {/* -------- Avatar / Name / Streak -------- */}
        <section className="flex flex-col items-center text-center relative">
          {/* Avatar + Badge */}
        {/* -------- Avatar / Name / Streak -------- */}
        <section className="flex flex-col items-center text-center relative">
          {/* Avatar + Badge */}
          <div className="relative mb-6">
            <ProfileAvatar
              user={user}
              weeklyStreak={weeklyStreak}
              size="lg"
              showBadge={true}
            />
          </div>

          {/* Name & handle */}
          <div className="flex flex-col items-center space-y-1 mb-2">
            <p className="text-4xl font-semibold">{user.username}</p>
            {user.handle && (
              <p className="text-lg text-white/60">@{user.handle}</p>
            )}
          </div>
        </section>
        </section>


        {/* -------- HISTORY / CALENDAR -------- */}
        <section>
          {/* History + Month + Nav + Today */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-3xl font-bold text-white">History</h2>

            <div className="flex items-center gap-2 text-sm font-semibold text-white/70">
              {/* Previous month */}
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-white/20 hover:bg-white/10 hover:text-white transition"
              >
                ‹
              </button>

              {/* Month label */}
              <span className="min-w-[140px] text-center text-white/80">
                {monthName}
              </span>

              {/* Next month */}
              <button
                type="button"
                onClick={goToNextMonth}
                disabled={isAtCurrentMonth}
                className={`
                  w-7 h-7 flex items-center justify-center rounded-full border border-white/20 transition
                  ${
                    isAtCurrentMonth
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                ›
              </button>

              {/* Today reset */}
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

          {/* CALENDAR CARD */}
          <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
            {loadingLogs ? (
              <p className="text-base text-white/60">
                Loading this month&apos;s activity…
              </p>
            ) : (
              <>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-2 mb-3 text-center text-sm font-medium text-white/60">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2 text-base">
                  {calendarCells.map((cell, idx) => {
                    if (!cell) {
                      return <div key={idx} className="h-10" />;
                    }

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
    </div>
  );
}
