// components/dashboard/LogTimeCard.tsx
'use client';

import { useState } from 'react';
import type { User, Category } from '@/lib/types';
import { QUICK_MINUTES, TRAINING_CATEGORIES } from '@/lib/constants';

type LogTimeCardProps = {
  user: User;
};

export default function LogTimeCard({ user }: LogTimeCardProps) {
  const [customMinutes, setCustomMinutes] = useState<number | ''>('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [category, setCategory] = useState<Category | ''>(''); // start blank
  const [comment, setComment] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  const canLog = !!category && !loading;

  async function logMinutes(minutes: number) {
    if (!category) {
      setStatus('Pick what you worked on first.');
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          minutes,
          category,
          comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || 'Error logging time');
      } else {
        setStatus(
          `Nice! Logged ${minutes} min of ${category}${
            comment.trim() ? ` — "${comment.trim()}"` : ''
          } 🔥`
        );
        setComment('');
        setCustomMinutes('');
        setShowCustomModal(false);
      }
    } catch {
      setStatus('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* MAIN CARD */}
      <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-3">
        <h2 className="text-lg font-bold mb-1 text-center">Log your work</h2>

        {/* Category selector */}
        <div className="space-y-1">
          <label className="text-xs text-slate-300">What did you work on?</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as Category | '')}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select what you worked on
            </option>
            {TRAINING_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {!category && (
            <p className="text-[11px] text-amber-300">
              Choose a category before picking minutes.
            </p>
          )}
        </div>

        {/* Comment box */}
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Comments (optional)</label>
          <textarea
            rows={2}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm resize-none"
            placeholder='e.g., "Tee work, line drives up the middle"'
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
        </div>

        {/* Quick minutes + Custom button */}
        <div className="flex gap-2">
          {QUICK_MINUTES.map(m => (
            <button
              key={m}
              disabled={!canLog}
              onClick={() => logMinutes(m)}
              className="flex-1 rounded-xl bg-slate-800 py-2 text-sm font-semibold shadow active:scale-95 disabled:opacity-40"
            >
              +{m} min
            </button>
          ))}
          <button
            type="button"
            disabled={!canLog}
            onClick={() => {
              if (!category) {
                setStatus('Pick what you worked on first.');
                return;
              }
              setShowCustomModal(true);
            }}
            className="flex-1 rounded-xl bg-slate-800 py-2 text-sm font-semibold shadow active:scale-95 disabled:opacity-40"
          >
            Custom
          </button>
        </div>

        {status && (
          <p className="text-xs text-center text-slate-200">{status}</p>
        )}
      </div>

      {/* CUSTOM MINUTES MODAL */}
      {showCustomModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
          <CustomMinutesModal
            category={category || ''}
            customMinutes={customMinutes}
            setCustomMinutes={setCustomMinutes}
            loading={loading}
            logMinutes={logMinutes}
            close={() => {
              setShowCustomModal(false);
              setCustomMinutes('');
            }}
          />
        </div>
      )}
    </>
  );
}

type CustomMinutesModalProps = {
  category: string;
  customMinutes: number | '';
  setCustomMinutes: (m: number | '') => void;
  loading: boolean;
  logMinutes: (m: number) => void;
  close: () => void;
};

function CustomMinutesModal({
  category,
  customMinutes,
  setCustomMinutes,
  loading,
  logMinutes,
  close,
}: CustomMinutesModalProps) {
  return (
    <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-5 shadow-2xl">
      <h3 className="text-xl font-extrabold text-center mb-2">
        Enter Custom Minutes
      </h3>

      <p className="text-sm text-slate-300 text-center">
        How long did you work on{' '}
        <span className="font-semibold text-lime-300">{category}</span>?
      </p>

      <div className="flex justify-center">
        <input
          autoFocus
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          min={1}
          value={customMinutes}
          onChange={e =>
            setCustomMinutes(
              e.target.value === '' ? '' : Number(e.target.value),
            )
          }
          className="
            w-40
            text-center
            text-4xl
            font-extrabold
            tracking-wide
            rounded-2xl
            border-2
            border-lime-400
            bg-slate-950
            px-4
            py-4
            shadow-inner
            focus:outline-none
            focus:ring-4
            focus:ring-lime-400/40
          "
          placeholder="0"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={close}
          className="flex-1 rounded-xl border border-slate-600 text-slate-200 py-3 text-sm"
          disabled={loading}
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={loading || !customMinutes}
          onClick={() => {
            if (typeof customMinutes === 'number' && customMinutes > 0) {
              logMinutes(customMinutes);
            }
          }}
          className="
            flex-1 
            rounded-xl 
            bg-lime-400 
            text-slate-950 
            font-bold 
            py-3 
            text-base 
            shadow-md 
            active:scale-95 
            disabled:opacity-40
          "
        >
          {loading ? 'Saving…' : 'Add'}
        </button>
      </div>
    </div>
  );
}
