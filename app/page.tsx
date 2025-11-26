// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import StreakAvatar from '@/components/streak/StreakAvatar';
import SignInCard from '@/components/auth/SignInCard';
import Dashboard from '@/components/dashboard/Dashboard';
import type { User } from '@/lib/types';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('levelup_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        // if parsing fails, clear bad data
        localStorage.removeItem('levelup_user');
      }
    }
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
          <StreakAvatar userId={user.id} />
        ) : (
          <div className="w-8" /> // keep symmetry when logged out
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {user ? (
          <Dashboard user={user} onLogout={handleLogout} />
        ) : (
          <SignInCard onSignedIn={setUser} />
        )}
      </main>
    </div>
  );
}
