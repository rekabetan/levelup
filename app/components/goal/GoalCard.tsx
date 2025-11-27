// app/components/dashboard/GoalCard.tsx
'use client';

import { useEffect, useState } from 'react';
import type { LogEntry, User } from '@/lib/types';
import SetWeeklyGoalSheet, {
  formatMinutesAsHoursLabel,
} from '@/components/goal/SetWeeklyGoalSheet';

type GoalCardProps = {
  user: User;
};

export default function GoalCard({ user }: GoalCardProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const [weeklyGoal, setWeeklyGoal] = useState<number | null>(
    user.weekly_goal ?? null
  );
  const [showGoalSheet, setShowGoalSheet] = useState(false);

  // Keep local weeklyGoal in sync if user changes elsewhere
  useEffect(() => {
    setWeeklyGoal(user.weekly_goal ?? null);
  }, [user.weekly_goal]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/logs?userId=${user.id}`);
        const data = await res.json();
        setLogs(data.logs || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
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

  const clampedProgress = Math.max(0, Math.min(progress, 100));

  const handleGoalSaved = (newGoal: number) => {
    setWeeklyGoal(newGoal);

    // Keep localStorage in sync so reloads on this device feel consistent
    try {
      const stored = localStorage.getItem('levelup_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = { ...parsed, weekly_goal: newGoal };
        localStorage.setItem('levelup_user', JSON.stringify(updated));
      }
    } catch {
      // ignore
    }
  };

  // ---- Empty State (no weekly goal set) ----
  if (!weeklyGoal) {
    return (
      <>
        <div
          className="
            w-full min-h-[200px]
            bg-white/5 backdrop-blur-xl
            border border-white/10
            rounded-2xl p-4
            shadow-2xl shadow-black/70
            flex flex-col
            text-white
            relative
          "
        >
          {/* Title */}
          <p className="mb-3 text-center text-xl font-bold uppercase tracking-wide">
            Weekly Goal
          </p>

          {/* Edit button (top-right) */}
          <button
            type="button"
            onClick={() => setShowGoalSheet(true)}
            className="
              absolute top-3 right-3
              text-xs font-medium 
              px-3 py-1.5 
              rounded-lg 
              border border-white/20 
              text-white/80 
              hover:text-white hover:bg-white/10 
              transition
            "
          >
            Edit
          </button>

          <div className="flex-1" />

          {/* Set Goal Button -> opens sheet */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowGoalSheet(true)}
              className="
                px-8 py-2 rounded-full text-xl font-semibold
                bg-lime-400 text-black
                hover:bg-lime-300 transition
              "
            >
              Set Goal
            </button>
          </div>

          <div className="flex-1" />
        </div>

        <SetWeeklyGoalSheet
          open={showGoalSheet}
          onClose={() => setShowGoalSheet(false)}
          user={user}
          currentGoalMinutes={weeklyGoal}
          onGoalSaved={handleGoalSaved}
        />
      </>
    );
  }

  // ---- Normal state ----
  const goalMinutes = weeklyGoal ?? 0;
  const timeRemaining = Math.max(goalMinutes - minutesThisWeek, 0);

  return (
    <>
      <div
        className="
          relative w-full min-w-[160px] min-h-[200px]
          bg-white/5
          backdrop-blur-xl
          border border-white/10
          rounded-2xl
          shadow-2xl shadow-black/70
          flex flex-col items-center text-white
          p-4
        "
      >
        {/* Edit button (top-right) */}
        <button
          type="button"
          onClick={() => setShowGoalSheet(true)}
          className="
            absolute top-3 right-3
            text-xs font-medium 
            px-3 py-1.5 
            rounded-lg 
            border border-white/20 
            text-white/80 
            hover:text-white hover:bg-white/10 
            transition
          "
        >
          Edit
        </button>

        {/* Title */}
        <div className="mb-3 text-center text-xl font-bold uppercase tracking-wide w-full">
          <p className="text-xl font-bold uppercase tracking-wide">
            Weekly Goal
          </p>
        </div>

        {/* Progress summary + bar */}
        <div className="w-full flex-1 flex flex-col items-center justify-center gap-4">
          {/* Big Remaining Time */}
          <span className="text-6xl font-black text-lime-400 leading-none">
            {formatMinutesAsHoursLabel(timeRemaining)}
          </span>

          {/* Row: left time | remaining | right time */}
          <div className="w-full flex items-center justify-between px-1">
            {/* Left — done */}
            <span className="text-md text-white/40 font-bold">
              {loading ? '–' : formatMinutesAsHoursLabel(minutesThisWeek)}
            </span>

            {/* Center — Remaining (aligned with small texts) */}
            <span className="text-sm text-white font-bold uppercase tracking-wide">
              Remaining
            </span>

            {/* Right — goal */}
            <span className="text-md text-white/40 font-bold">
              {formatMinutesAsHoursLabel(goalMinutes)}
            </span>
          </div>

          {/* Bar */}
          <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-lime-400 transition-[width] duration-300"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
        </div>
      </div>

      <SetWeeklyGoalSheet
        open={showGoalSheet}
        onClose={() => setShowGoalSheet(false)}
        user={user}
        currentGoalMinutes={weeklyGoal}
        onGoalSaved={handleGoalSaved}
      />
    </>
  );
}
