// components/dashboard/GoalCard.tsx
'use client';

import { useEffect, useState } from 'react';
import type { LogEntry, User } from '@/lib/types';
import Link from 'next/link';

type GoalCardProps = {
  user: User;
};

export default function GoalCard({ user }: GoalCardProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const weeklyGoal = user.weekly_goal ?? null;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/logs?userId=${user.id}`);
        const data = await res.json();
        setLogs(data.logs || []);
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [user.id]);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(now.getDate() - now.getDay());

  const minutesThisWeek = logs
    .filter((log) => new Date(log.created_at) >= weekStart)
    .reduce((sum, log) => sum + log.minutes, 0);

  const progress = weeklyGoal
    ? Math.min((minutesThisWeek / weeklyGoal) * 100, 100)
    : 0;

  // ---- Empty State (no weekly goal set) ----
  if (!weeklyGoal) {
    return (
      <div
        className="
          w-full min-h-[180px]
          bg-white/5 backdrop-blur-xl
          border border-white/10
          rounded-2xl p-4
          shadow-2xl shadow-black/70
          flex flex-col
          text-white
        "
      >
        {/* Title */}
        <p className="text-xl font-bold uppercase tracking-wide mb-3 text-center">
          Weekly Goal
        </p>

        <div className="flex-1" />

        {/* Set Goal Button */}
        <div className="flex justify-center">
          <Link
            href="/profile"
            className="
              px-8 py-2 rounded-full text-xl font-semibold
              bg-lime-400 text-black
              hover:bg-lime-300 transition
            "
          >
            Set Goal
          </Link>
        </div>

        <div className="flex-1" />
      </div>
    );
  }

  // ---- Normal state ----
  return (
    <div
      className="
        w-1/2 min-w-[160px]
        bg-white/5 backdrop-blur-xl
        border border-white/10
        rounded-2xl p-4
        shadow-2xl shadow-black/70
        flex flex-col items-center justify-start
        text-white
      "
    >
      {/* Title */}
      <p className="text-[16px] font-bold uppercase tracking-wide mb-3">
        Weekly Goal
      </p>

      <span className="text-3xl font-black text-lime-400 leading-none">
        {loading ? '–' : minutesThisWeek}
      </span>

      <p className="text-[12px] text-white/50 mt-1">
        of {weeklyGoal} minutes
      </p>

      {/* Progress Bar */}
      <div className="mt-2 w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-lime-400 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
