// components/logs/LogTimeSheet.tsx
'use client';

import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Category } from '@/lib/types';

type LogTimeSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
};

const CATEGORIES: Category[] = [
  'Hitting',
  'Infield',
  'Outfield',
  'Pitching',
  'Baserunning',
  'Fitness',
  'Mental',
];

const PRESET_MINUTES = [10, 15, 20, 30, 45, 60];

export default function LogTimeSheet({
  isOpen,
  onClose,
  userId,
}: LogTimeSheetProps) {
  const [minutes, setMinutes] = useState<number>(30);
  const [activePreset, setActivePreset] = useState<number | null>(30);
  const [useCustom, setUseCustom] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  // Validity checks
  const hasMinutes = useCustom ? Number(customMinutes) > 0 : minutes > 0;
  const canSave = hasMinutes && !!category && !saving;
  const displayMinutes =
    useCustom && customMinutes !== '' ? customMinutes : `${minutes}`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    let finalMinutes = minutes;

    if (useCustom) {
      const parsed = Number(customMinutes);
      if (!parsed || parsed <= 0) return;
      finalMinutes = parsed;
      setMinutes(parsed);
    }

    try {
      setSaving(true);

      const { error } = await supabase.from('training_logs').insert({
        user_id: userId,
        minutes: finalMinutes,
        category,
        comment: comment || null,
      });

      if (error) {
        console.error('Error inserting training log:', error.message);
        setSaving(false);
        return;
      }

      // Reset UI
      setActivePreset(finalMinutes);
      setUseCustom(false);
      setCustomMinutes('');
      setComment('');

      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handlePresetClick = (value: number) => {
    setMinutes(value);
    setActivePreset(value);
    setUseCustom(false);
    setCustomMinutes('');
  };

  const handleCustomClick = () => {
    setUseCustom(true);
    setActivePreset(null);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="
          relative z-40 w-full max-w-md
          h-[75vh] overflow-y-auto
          bg-zinc-950 shadow-2xl
          rounded-t-3xl sm:rounded-3xl
          px-5 pt-4 pb-6
          border border-white/10
        "
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-center">
          <h2 className="text-xl font-semibold text-white">
            Log Time
          </h2>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Minutes */}
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <label className="block text-sm font-medium text-white/80">
                Minutes
              </label>
              <span className="text-base font-semibold text-lime-400">
                {displayMinutes} min
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {PRESET_MINUTES.map((m) => {
                const isActive = !useCustom && activePreset === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handlePresetClick(m)}
                    className={
                      'rounded-xl px-3 py-3 text-sm font-medium transition ' +
                      (isActive
                        ? 'bg-lime-400 text-black shadow-md'
                        : 'bg-zinc-900 text-white/80 hover:bg-zinc-800')
                    }
                  >
                    {m}m
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleCustomClick}
              className={
                'w-full rounded-xl px-3 py-3 text-sm font-medium transition ' +
                (useCustom
                  ? 'bg-lime-400 text-black shadow-md'
                  : 'bg-zinc-900 text-white/80 hover:bg-zinc-800')
              }
            >
              {useCustom ? 'Custom minutes selected' : 'Custom minutes'}
            </button>

            {useCustom && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Enter custom minutes
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={customMinutes}
                  onChange={(e) =>
                    setCustomMinutes(e.target.value.replace(/[^0-9]/g, ''))
                  }
                  className="
                    w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white
                    outline-none ring-1 ring-white/10 focus:ring-lime-400
                  "
                  placeholder="e.g. 35"
                />
              </div>
            )}
          </div>

          {/* Category (required) */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value === '' ? '' : (e.target.value as Category)
                )
              }
              className="
                w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white
                outline-none ring-1 ring-white/10 focus:ring-lime-400
              "
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Comments
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="
                w-full resize-none rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white
                outline-none ring-1 ring-white/10 focus:ring-lime-400
              "
              placeholder="e.g., Tee work, line drives to the opposite field"
            />
          </div>

          {/* Buttons */}
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="
                flex-1 rounded-xl border border-white/20
                bg-black px-4 py-3 text-sm font-semibold text-white
                hover:bg-zinc-900 transition
              "
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSave}
              className={
                'flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ' +
                (canSave
                  ? 'bg-lime-400 text-black hover:bg-lime-300'
                  : 'bg-lime-400/30 text-lime-200/60 cursor-not-allowed')
              }
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
