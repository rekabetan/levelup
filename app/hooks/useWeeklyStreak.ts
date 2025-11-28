// app/hooks/useWeeklyStreak.ts
'use client';

import { useEffect, useState } from 'react';
import { computeWeeklyStreak } from '../../lib/streak';    // relative path
import type { LogEntry } from '../../lib/types';

export function useWeeklyStreak(userId: string | null | undefined) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLogs([]);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/logs?userId=${userId}`);
        const data = await res.json();
        setLogs(data.logs || []);
      } catch (err) {
        console.error('Failed to load logs (useWeeklyStreak)', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  const weeklyStreak = logs.length ? computeWeeklyStreak(logs) : 0;

  return { weeklyStreak, loading };
}
