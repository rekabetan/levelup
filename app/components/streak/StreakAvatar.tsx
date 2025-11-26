// app/components/StreakAvatar.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getQualifyingDaysThisWeek } from '@/lib/streak';
import { LogEntry } from '@/lib/types';

type StreakAvatarProps = {
  userId: string;
};

export default function StreakAvatar({ userId }: StreakAvatarProps) {
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

  // ✅ use shared helper from /lib/streak
  const qualifyingDays = getQualifyingDaysThisWeek(logs as any);
  const segmentsActive = [1, 2, 3, 4].map(n => qualifyingDays >= n);

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const segments = 4;
  const segmentSpan = circumference / segments;
  const visiblePortion = 0.7;
  const visibleLength = segmentSpan * visiblePortion;

  return (
    <Link
      href="/profile"
      className="block active:scale-95 transition-transform"
    >
      <div className="relative w-10 h-10">
        {/* Segmented circular arcs */}
        <svg viewBox="0 0 60 60" className="absolute inset-0 w-full h-full">
          {segmentsActive.map((active, index) => (
            <circle
              key={index}
              cx={30}
              cy={30}
              r={radius}
              fill="none"
              stroke={active ? '#a3e635' : '#334155'} // lime-400 / slate-700
              strokeWidth={6}
              strokeLinecap="round"
              style={{
                strokeDasharray: `${visibleLength} ${circumference}`,
                strokeDashoffset: `${-segmentSpan * index}`,
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%',
              }}
            />
          ))}
        </svg>

        {/* Inner circle */}
        <div className="absolute inset-3 rounded-full bg-slate-900 border border-slate-700 shadow-xl flex items-center justify-center">
          {loading ? (
            <span className="text-xs text-slate-400">…</span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 text-slate-100"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0"
              />
            </svg>
          )}
        </div>
      </div>
    </Link>
  );
}
