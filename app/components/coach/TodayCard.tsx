// app/components/coach/TodayCard.tsx
'use client';

import React from "react";
import Link from "next/link";
import Section from "@/app/components/ui/Section";
import { formatMinutesAsHoursLabel } from "@/components/goal/SetWeeklyGoalSheet";

export type TodayEntry = {
  playerName: string;
  category: string | null;
  minutes: number;
  timeLabel: string;
  note?: string | null;
};

type TodayCardProps = {
  entries: TodayEntry[];
  loading?: boolean;
};

export default function TodayCard({ entries, loading }: TodayCardProps) {
  const hasMany = entries.length > 5;
  const visible = entries.slice(0, 5);

  return (
    <Section
      title="Today"
      action={
        hasMany && (
          <Link
            href="/logs?filter=today"
            className="text-sm font-semibold text-lime-400 hover:text-lime-300"
          >
            Show more →
          </Link>
        )
      }
    >
      {loading ? (
        <p className="text-base text-white/60">
          Loading today&apos;s sessions…
        </p>
      ) : entries.length === 0 ? (
        <p className="text-base text-white/60">No sessions logged today.</p>
      ) : (
        <ul className="space-y-4">
          {visible.map((entry, idx) => (
            <li
              key={idx}
              className="flex flex-col gap-2 border-b border-white/5 pb-4 last:border-b-0 last:pb-0"
            >
              {/* ---------- Row 1 ---------- */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-white">
                    {entry.playerName}
                  </span>

                  {entry.category && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                      {entry.category}
                    </span>
                  )}
                </div>

                {/* Convert minutes → "1h 30m" */}
                <span className="text-base font-bold text-white">
                  {formatMinutesAsHoursLabel(entry.minutes)}
                </span>
              </div>

              {/* ---------- Row 2 ---------- */}
              <div className="flex justify-between items-end">
                <span className="text-sm text-white/70 leading-tight">
                  {entry.note ?? ""}
                </span>

                <span className="text-xs text-white/40">
                  {entry.timeLabel}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
