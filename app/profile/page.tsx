// app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type User = {
  id: string;
  username: string;
  handle?: string | null;
};

type LogEntry = {
  id: string;
  minutes: number;
  category: string | null;
  comment: string | null;
  created_at: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [storedRaw, setStoredRaw] = useState<string | null>(null); // debug

  // 1) Read localStorage once on the client
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = window.localStorage.getItem('levelup_user');
    console.log('[Profile] stored levelup_user =', stored);
    setStoredRaw(stored); // so we can see it in the UI

    if (stored) {
      try {
        const parsed: User = JSON.parse(stored);
        setUser(parsed);
      } catch (err) {
        console.log('[Profile] Failed to parse stored user', err);
        setUser(null);
      }
    } else {
      setUser(null);
    }

    setHydrated(true);
  }, []);

  // 2) Load logs once user is known
  useEffect(() => {
    if (!user) return;

    const userId = user.id;

    async function loadLogs() {
      setLoadingLogs(true);
      setError(null);
      try {
        const res = await fetch(`/api/logs?userId=${userId}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Could not load activity.');
        } else {
          setLogs(data.logs || []);
        }
      } catch {
        setError('Network error');
      } finally {
        setLoadingLogs(false);
      }
    }

    loadLogs();
  }, [user]);

  // 3) Delete a log
  async function handleDelete(logId: string) {
    if (!user) return;
    if (!confirm('Delete this log?')) return;

    const userId = user.id;

    setDeletingId(logId);
    setError(null);
    try {
      const res = await fetch('/api/logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId, userId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not delete log.');
      } else {
        setLogs(prev => prev.filter(l => l.id !== logId));
      }
    } catch {
      setError('Network error');
    } finally {
      setDeletingId(null);
    }
  }

  // Wait until we've read localStorage
  if (!hydrated) {
    return null;
  }

  // If no user after hydration, show a simple "not logged in" with debug
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-sm text-slate-300 mb-2">Not logged in on this device.</p>
          <p className="text-[10px] text-slate-500 break-all mb-4">
            Debug stored levelup_user: {storedRaw ?? 'null'}
          </p>
          <Link href="/" className="text-sm text-lime-300 underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Logged in: render your real profile
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 w-full py-4 bg-slate-900/80 backdrop-blur border-b border-slate-800 shadow-md flex items-center justify-between px-4">
        <Link href="/" className="text-sm text-slate-300">
          ← Home
        </Link>

        <h1 className="text-lg font-bold tracking-tight text-center flex-1">
          {user.username}
          {user.handle && (
            <span className="text-sm text-slate-400 ml-1">
              (@{user.handle})
            </span>
          )}
        </h1>

        <div className="w-10" /> {/* spacer */}
      </header>


      <main className="flex-1 p-4 flex flex-col gap-4">
        {/* Activity list */}
        <div className="w-full max-w-xl mx-auto px-2 flex-1">
          <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4 shadow-lg h-full flex flex-col">
            <h2 className="text-sm font-bold mb-3">Recent Activity</h2>

            {loadingLogs ? (
              <p className="text-sm text-slate-300 text-center">Loading…</p>
            ) : logs.length === 0 ? (
              <p className="text-sm text-slate-400 text-center">
                No logs yet. Go put in some work!
              </p>
            ) : (
              <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {logs.map(log => {
                  const created = new Date(log.created_at);
                  const prettyDate = created.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  });
                  const prettyTime = created.toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                  });

                  return (
                    <li
                      key={log.id}
                      className="flex items-start justify-between rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs"
                    >
                      <div className="flex-1 mr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lime-300 font-bold">
                            {log.minutes} min
                          </span>
                          {log.category && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-600">
                              {log.category}
                            </span>
                          )}
                        </div>
                        {log.comment && (
                          <p className="text-[11px] text-slate-200">
                            {log.comment}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-1">
                          {prettyDate} · {prettyTime}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDelete(log.id)}
                        disabled={deletingId === log.id}
                        className="text-[11px] text-red-300 border border-red-400/60 rounded-full px-2 py-1 hover:bg-red-500/10 disabled:opacity-40"
                      >
                        {deletingId === log.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {error && (
              <p className="text-xs text-center text-red-300 mt-2">{error}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
