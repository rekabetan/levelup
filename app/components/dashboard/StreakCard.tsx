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
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  const weeklyStreak = computeWeeklyStreak(logs);

  // Count unique days logged (any minutes)
  const uniqueDates = new Set(
    logs.map((l) => new Date(l.created_at).toDateString())
  );
  const daysLoggedCount = uniqueDates.size;

  return (
    <div
      className="
        relative w-full min-w-[160px] min-h-[240px]
        bg-white/5
        backdrop-blur-xl
        border border-white/10
        rounded-2xl
        shadow-2xl shadow-black/70
        flex flex-col
        text-white
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
          absolute top-3 left-3 h-6 w-6
          flex items-center justify-center
          rounded-full
          border border-white/30
          text-[11px] text-white/30
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
            absolute top-10 left-3 w-60
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

      {/* Middle section (flexes) */}
      <div className="flex-1 flex items-center justify-center">
        <span className="text-8xl font-black text-lime-400 leading-none">
          {loading ? '–' : weeklyStreak}
        </span>
      </div>

      {/* Bottom section — pinned like GoalCard progress bar */}
      <div className="w-full mt-4">
        <div className="w-full flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`
                h-3 flex-1 rounded-md transition-all
                ${daysLoggedCount >= i ? 'bg-lime-400' : 'bg-white/20'}
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
