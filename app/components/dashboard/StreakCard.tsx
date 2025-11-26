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

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/logs?userId=${userId}`);
        const data = await res.json();
        setLogs(data.logs || []);
      } catch {
        // ignore for now
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  const weeklyStreak = computeWeeklyStreak(logs);

  return (
    <div className="w-full flex justify-start">
      <div className="w-1/2 min-w-[160px] bg-slate-900/70 border border-slate-700 rounded-2xl p-4 shadow-lg flex flex-col items-center justify-center">
        <p className="text-[11px] text-slate-400 mb-1 uppercase tracking-wide">
          Weekly Streak
        </p>
        <span className="text-4xl font-black text-lime-400 leading-none">
          {loading ? '–' : weeklyStreak}
        </span>
        <p className="text-[10px] text-slate-500 mt-1">
          Weeks with 4+ days logged
        </p>
      </div>
    </div>
  );
}
