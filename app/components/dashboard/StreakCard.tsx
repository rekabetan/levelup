// components/dashboard/StreakCard.tsx
'use client';

import { useEffect, useState } from 'react';
import type { LogEntry } from '@/lib/types';
import { computeWeeklyStreak } from '@/lib/streak';

type StreakCardProps = {
  userId: string;
};

export default function StreakCard({ userId }: StreakCardProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/logs?userId=${userId}`);
        const data = await res.json();
        setLogs(data.logs || []);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  const weeklyStreak = computeWeeklyStreak(logs);

  return (
    <div
      className="
        relative w-full min-w-[160px] min-h-[200px]
        bg-white/5              /* dark translucent glass over black */
        backdrop-blur-xl        /* now actually visible */
        border border-white/10
        rounded-2xl
        shadow-2xl shadow-black/70
        flex flex-col items-center text-white
        p-4
      "
    >
      {/* Title */}
      <p className="text-xl font-bold uppercase tracking-wide mb-3 text-center w-full">
        Weekly Streak
      </p>

      {/* Help Icon */}
      <button
        type="button"
        onClick={() => setShowHelp((prev) => !prev)}
        aria-label="What is Weekly Streak?"
        className="
          absolute top-4 right-4 h-5 w-5
          flex items-center justify-center
          rounded-full
          border border-white/30
          text-[11px] text-white/80
          hover:bg-white/15 hover:border-white/60
          transition
        "
      >
        ?
      </button>

      {/* Help Popover */}
      {showHelp && (
        <div
          className="
            absolute top-10 right-4 w-60
            bg-black/85 backdrop-blur-lg
            border border-white/15
            rounded-xl p-3
            text-xs text-white
            shadow-xl shadow-black/70
            z-20
          "
        >
          <p className="mb-2 leading-snug">
            A <span className="font-semibold text-lime-400">Weekly Streak</span> means you logged
            15 minutes of training on at least{' '}
            <span className="font-semibold">4 different days</span> this week.
          </p>

          <p className="text-[11px] text-white/50 leading-snug">
            Consistency matters more than total minutes.
          </p>

          <button
            type="button"
            onClick={() => setShowHelp(false)}
            className="mt-2 text-[11px] font-semibold text-lime-400 hover:text-lime-300 underline"
          >
            Got it
          </button>
        </div>
      )}

      {/* Spacer ABOVE number */}
      <div className="flex-1" />

      {/* Streak Number */}
      <span className="text-8xl font-black text-lime-400 leading-none">
        {loading ? '–' : weeklyStreak}
      </span>

      {/* Spacer BELOW number */}
      <div className="flex-1" />
    </div>
  );
}
