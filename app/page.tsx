// app/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

type User = {
  id: string;
  username: string; // Display Name (e.g., Brooks)
  handle?: string | null; // e.g., @bgballer
};

type Entry = {
  username: string;
  total_minutes: number;
};

type Period = 'week' | 'month' | 'all';

type Category =
  | 'Hitting'
  | 'Infield'
  | 'Outfield'
  | 'Pitching'
  | 'Baserunning'
  | 'Fitness'
  | 'Mental';

type LogEntry = {
  id: string;
  minutes: number;
  category: string | null;
  comment: string | null;
  created_at: string;
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('levelup_user');
    if (stored) setUser(JSON.parse(stored));
    setLoaded(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('levelup_user');
    setUser(null);
  };

  if (!loaded) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 🔥 TOP HEADER */}
      <header className="sticky top-0 z-20 w-full py-4 bg-slate-900/80 backdrop-blur border-b border-slate-800 shadow-md flex items-center justify-between px-4">
        {/* Left spacer to balance layout */}
        <div className="w-8" />

        {/* Center title */}
        <h1 className="text-3xl font-black text-center tracking-tight flex-1">
          Level<span className="text-lime-400">Up</span>
        </h1>

        {/* Right: profile button if logged in */}
        {user ? (
          <FloatingProfileButton userId={user.id} />
        ) : (
          <div className="w-8" /> // keep symmetry when logged out
        )}
      </header>


      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {user ? (
          <Dashboard user={user} onLogout={handleLogout} />
        ) : (
          <LoginCard onLoggedIn={setUser} />
        )}
      </main>
    </div>
  );
}

function LoginCard({ onLoggedIn }: { onLoggedIn: (u: User) => void }) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // stage: 'username' → just entered name
  // stage: 'pin'      → username confirmed, asking for PIN
  const [stage, setStage] = useState<'username' | 'pin'>('username');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    if (stage === 'username') {
      // First step: verify the username exists & is verified
      if (!username.trim()) {
        setStatus('Please enter your name.');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/login/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });

        const data = await res.json();
        if (!res.ok) {
          setStatus(data.error || 'Could not find that player.');
        } else {
          // Name is valid – move to PIN entry stage
          setStage('pin');
          setStatus(null);
        }
      } catch {
        setStatus('Network error');
      } finally {
        setLoading(false);
      }

      return;
    }

    // stage === 'pin'
    if (!pin.trim()) {
      setStatus('Please enter your PIN.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || 'Error logging in');
      } else {
        // Make sure this matches your User type
        const user: User = {
          id: data.id,
          username: data.username,
          handle: data.handle ?? null,
        };

        // 🔑 Persist for ProfilePage + refreshes + phone
        window.localStorage.setItem('levelup_user', JSON.stringify(user));

        // Notify parent
        onLoggedIn(user);
      }
    } catch {
      setStatus('Network error');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setUsername('');
    setPin('');
    setStage('username');
    setStatus(null);
  }

  return (
    <div className="w-full max-w-xl mx-auto px-2">
      <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-5 shadow-xl">
        <h2 className="text-xl font-bold mb-3 text-center">Team Login</h2>
        <p className="text-xs text-slate-300 text-center mb-3">
          First, enter your name. Then we&apos;ll ask for your secret PIN.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-300">
              {stage === 'username' ? 'Player Name' : 'Player Name (locked)'}
            </label>
            <input
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-400 disabled:opacity-60"
              placeholder="e.g., Brooks"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={stage === 'pin'}
            />
          </div>

          {stage === 'pin' && (
            <div className="space-y-1">
              <label className="text-xs text-slate-300">PIN</label>
              <input
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-400"
                placeholder="4-digit PIN"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={e => setPin(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-2">
            {stage === 'pin' && (
              <button
                type="button"
                onClick={reset}
                className="flex-1 rounded-xl border border-slate-600 text-slate-200 py-2 text-sm"
                disabled={loading}
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`${
                stage === 'username' ? 'w-full' : 'flex-1'
              } rounded-xl bg-lime-400 text-slate-950 font-semibold py-2 text-sm shadow-md active:scale-95 disabled:opacity-60`}
            >
              {loading
                ? stage === 'username'
                  ? 'Checking…'
                  : 'Logging in…'
                : stage === 'username'
                ? 'Next'
                : 'Continue'}
            </button>
          </div>

          {status && (
            <p className="text-sm text-center text-red-300">{status}</p>
          )}
        </form>
      </div>
    </div>
  );
}

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const needsHandle = !user.handle;

  return (
    <div className="w-full max-w-xl mx-auto px-2 space-y-4">
      <div className="flex items-center justify-between bg-slate-900/70 px-4 py-3 rounded-2xl border border-slate-700">
        <div>
          <p className="text-lg text-slate-300 font-bold">
            Welcome, {user.username}!
          </p>
        </div>
        <button
          onClick={onLogout}
          className="text-xs border border-slate-500 rounded-full px-3 py-1 hover:bg-slate-800"
        >
          Sign out
        </button>
      </div>

      {needsHandle ? (
        <ChooseHandleCard user={user} />
      ) : (
        <>
          <StreakCard userId={user.id} />
          <LogTimeCard user={user} />
          <LeaderboardCard currentUser={user.username} />
        </>
      )}
    </div>
  );
}

function FloatingProfileButton({ userId }: { userId: string }) {
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

  function getQualifyingDaysThisWeek(entries: LogEntry[]): number {
    if (!entries.length) return 0;

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - dayOfWeek
    ); // Sunday 00:00

    const totals = new Map<number, number>();

    for (const log of entries) {
      const d = new Date(log.created_at);
      if (d < startOfWeek || d > now) continue;

      const dayMidnight = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate()
      ).getTime();

      totals.set(dayMidnight, (totals.get(dayMidnight) || 0) + log.minutes);
    }

    let qualifyingDays = 0;
    for (const total of totals.values()) {
      if (total >= 15) qualifyingDays += 1;
    }

    return Math.min(4, qualifyingDays);
  }

  const qualifyingDays = getQualifyingDaysThisWeek(logs);
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

        {/* Inner circle (icon for now; we can swap to initial later if you want) */}
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



/** 🔥 Weekly Streak Card — consecutive weeks with 4+ days of 15+ minutes */
function StreakCard({ userId }: { userId: string }) {
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

  // Helper: get start-of-week (Sunday 00:00) for a given date
  function getWeekStart(date: Date): number {
    const dayOfWeek = date.getDay(); // 0 = Sunday
    const start = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() - dayOfWeek
    );
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  }

  /**
   * Weekly streak:
   * - A "qualifying day" = total minutes that day >= 15
   * - A "qualifying week" = 4+ qualifying days in that week
   * - Weekly streak = number of consecutive qualifying weeks ending with this week
   */
  function computeWeeklyStreak(entries: LogEntry[]): number {
    if (!entries.length) return 0;

    // 1) total minutes per day
    const minutesPerDay = new Map<number, number>(); // dayMidnight -> total minutes

    for (const log of entries) {
      const d = new Date(log.created_at);
      const dayMidnight = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate()
      ).getTime();

      minutesPerDay.set(
        dayMidnight,
        (minutesPerDay.get(dayMidnight) || 0) + log.minutes
      );
    }

    // 2) count qualifying days per week (>= 15 min)
    const qualifyingDaysPerWeek = new Map<number, number>(); // weekStart -> count of qualifying days

    for (const [dayMidnight, totalMinutes] of minutesPerDay.entries()) {
      if (totalMinutes < 15) continue; // not a qualifying day

      const dayDate = new Date(dayMidnight);
      const weekStart = getWeekStart(dayDate);

      qualifyingDaysPerWeek.set(
        weekStart,
        (qualifyingDaysPerWeek.get(weekStart) || 0) + 1
      );
    }

    // 3) mark which weeks are "qualifying weeks" (>= 4 qualifying days)
    const qualifyingWeeks = new Set<number>();
    for (const [weekStart, days] of qualifyingDaysPerWeek.entries()) {
      if (days >= 4) qualifyingWeeks.add(weekStart);
    }

    if (qualifyingWeeks.size === 0) return 0;

    // 4) compute streak from *current* week backwards
    const now = new Date();
    let currentWeekStart = getWeekStart(now);
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    let streak = 0;
    while (qualifyingWeeks.has(currentWeekStart)) {
      streak += 1;
      currentWeekStart -= oneWeekMs; // previous week
    }

    return streak;
  }

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

function LogTimeCard({ user }: { user: User }) {
  const QUICK = [10, 15, 20, 30];
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
            <option value="Hitting">Hitting</option>
            <option value="Infield">Infield</option>
            <option value="Outfield">Outfield</option>
            <option value="Pitching">Pitching</option>
            <option value="Baserunning">Baserunning</option>
            <option value="Fitness">Fitness</option>
            <option value="Mental">Mental</option>
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
          {QUICK.map(m => (
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
            category={category}
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

function CustomMinutesModal({
  category,
  customMinutes,
  setCustomMinutes,
  loading,
  logMinutes,
  close,
}: {
  category: string;
  customMinutes: number | '';
  setCustomMinutes: (m: number | '') => void;
  loading: boolean;
  logMinutes: (m: number) => void;
  close: () => void;
}) {
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

function LeaderboardCard({ currentUser }: { currentUser: string }) {
  const [period, setPeriod] = useState<Period>('week');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?period=${period}`);
        const data = await res.json();
        setEntries(data.entries || []);
      } catch {
        // ignore for now
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [period]);

  const tabs: { key: Period; label: string }[] = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4 shadow-lg">
      <div className="flex mb-3 rounded-full bg-slate-950/70 border border-slate-700 p-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setPeriod(tab.key)}
            className={`flex-1 rounded-full text-xs py-1 ${
              period === tab.key
                ? 'bg-lime-400 text-slate-950 font-bold'
                : 'text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-center text-slate-300">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-center text-slate-400">
          No minutes logged yet. Be the first!
        </p>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {entries.map((e, idx) => {
            const isMe = e.username === currentUser;
            const medal =
              idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';

            return (
              <li
                key={e.username}
                className={`flex justify-between items-center rounded-xl px-3 py-2 border ${
                  isMe
                    ? 'border-lime-400 bg-slate-900'
                    : 'border-slate-700 bg-slate-950/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 text-center text-lg">
                    {medal || idx + 1}
                  </span>
                  <span className={isMe ? 'font-bold' : ''}>
                    {e.username}
                    {isMe && (
                      <span className="text-xs ml-1 text-lime-300">(You)</span>
                    )}
                  </span>
                </div>
                <span className="text-sm font-semibold">
                  {e.total_minutes} min
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ChooseHandleCard({ user }: { user: User }) {
  const [handle, setHandle] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitHandle(e: React.FormEvent) {
    e.preventDefault();
    if (!handle.trim()) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/profile/handle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, handle }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || 'Error saving handle');
      } else {
        // Update local user in localStorage so refresh keeps it
        const updated: User = {
          id: data.id,
          username: data.username,
          handle: data.handle,
        };
        localStorage.setItem('levelup_user', JSON.stringify(updated));
        // Hard reload to let Home re-read updated user
        window.location.reload();
      }
    } catch {
      setStatus('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-3">
      <h2 className="text-lg font-bold text-center">Choose your LevelUp name</h2>
      <p className="text-xs text-slate-300 text-center">
        This is how you&apos;ll show up on the leaderboard.
      </p>
      <form onSubmit={submitHandle} className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Username</label>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-sm">@</span>
            <input
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              placeholder="username"
              value={handle}
              onChange={e => setHandle(e.target.value)}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-lime-400 text-slate-950 font-semibold py-2 text-sm shadow-md active:scale-95 disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Save username'}
        </button>
        {status && (
          <p className="text-xs text-center text-red-300">{status}</p>
        )}
      </form>
    </div>
  );
}
