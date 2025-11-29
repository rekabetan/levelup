// app/components/goal/SetWeeklyGoalSheet.tsx
'use client';

import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';

export function formatMinutesAsHoursLabel(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return "0m";
  }

  const rounded = Math.round(totalMinutes);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;

  // If less than an hour → "15m"
  if (h === 0) {
    return `${m}m`;
  }

  // If exact hours → "1h", "2h"
  if (m === 0) {
    return `${h}h`;
  }

  // Standard case → "1h 30m"
  return `${h}h ${m}m`;
}


type SetWeeklyGoalSheetProps = {
  open: boolean;
  onClose: () => void;
  user: User;
  onGoalSaved?: (newGoalMinutes: number) => void; // minutes
  currentGoalMinutes?: number | null;             // current goal from parent
};

function minutesToHoursStep(minutes: number | null | undefined): number {
  if (!minutes || minutes <= 0) return 1; // default 1h
  const rawHours = minutes / 60;
  const snapped = Math.round(rawHours / 0.25) * 0.25; // 15 min steps
  return Math.max(1, Math.min(20, snapped));
}

function formatHoursAndMinutes(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const mm = m.toString().padStart(2, '0'); // always 2 digits
  return `${h}h ${mm}m`; // always show minutes, even 00
}

export default function SetWeeklyGoalSheet({
  open,
  onClose,
  user,
  onGoalSaved,
  currentGoalMinutes,
}: SetWeeklyGoalSheetProps) {
  // Prefer the fresh value from parent, fall back to user.weekly_goal
  const [hours, setHours] = useState<number>(
    minutesToHoursStep(currentGoalMinutes ?? user.weekly_goal ?? null)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setHours(
        minutesToHoursStep(currentGoalMinutes ?? user.weekly_goal ?? null)
      );
      setError(null);
    }
  }, [open, currentGoalMinutes, user.weekly_goal]);

  if (!open) return null;

  const clampHours = (value: number) => Math.max(1, Math.min(20, value));

  const nudge = (delta: number) => {
    setHours((prev) => {
      const next = Math.round((prev + delta) / 0.25) * 0.25;
      return clampHours(next);
    });
  };

  const totalMinutes = Math.round(hours * 60);
  const displayLabel = formatHoursAndMinutes(hours);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const weekly_goal = totalMinutes;

      const res = await fetch('/api/user/weekly-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, weekly_goal }),
      });

      if (!res.ok) throw new Error();

      onGoalSaved?.(weekly_goal);
      onClose();
    } catch {
      setError('Could not save goal. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="
          relative z-50 w-full max-w-md
          rounded-t-3xl
          bg-white/5 backdrop-blur-xl
          border border-white/10
          shadow-[0_-20px_60px_rgba(0,0,0,0.9)]
          px-6 pt-5 pb-7
        "
      >

        {/* Title */}
        <h2 className="mb-12 text-center text-xl font-bold uppercase tracking-wide text-white">
          Weekly Goal
        </h2>

        {/* Daily breakdown: 4 training days */}
        {(() => {
          const dailyMin = totalMinutes / 4; // 4-day streak requirement
          const rounded = Math.round(dailyMin); // clean integer minutes
          const h = Math.floor(rounded / 60);
          const m = rounded % 60;

          let perDayString = '';

          if (h > 0 && m === 0) {
            // exact hour(s)
            perDayString = h === 1 ? '1 hour' : `${h} hours`;
          } else if (h > 0 && m > 0) {
            // mixed: e.g. 1 hour 30 minutes
            perDayString =
              h === 1
                ? `1 hour ${m} minutes`
                : `${h} hours ${m} minutes`;
          } else {
            // under an hour
            perDayString = `${m} minutes`;
          }

          return (
            <p className="mb-8 text-center text-lg text-white/40">
              Training 4 days per week, that’s just{' '}
              <span className="text-white font-bold">{perDayString} </span>
              per day!
            </p>
          );
        })()}

        {/* Stepper */}
        <div className="mb-12 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => nudge(-0.25)}
            className="
              h-12 w-12 rounded-full border border-white/20
              text-2xl text-white flex items-center justify-center
              hover:bg-white/10 transition
            "
          >
            –
          </button>

          <span className="min-w-[140px] text-center text-5xl font-black text-lime-400">
            {displayLabel}
          </span>

          <button
            type="button"
            onClick={() => nudge(0.25)}
            className="
              h-12 w-12 rounded-full border border-white/20
              text-2xl text-white flex items-center justify-center
              hover:bg-white/10 transition
            "
          >
            +
          </button>
        </div>

        {error && (
          <p className="mb-3 text-center text-sm text-red-400">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="
              flex-1 rounded-full border border-white/20
              bg-transparent px-4 py-2 text-sm font-medium
              text-white hover:bg-white/10 transition
              disabled:opacity-40
            "
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="
              flex-1 rounded-full px-4 py-2
              bg-lime-400 text-black font-semibold
              hover:bg-lime-300 transition
              disabled:opacity-50
            "
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
