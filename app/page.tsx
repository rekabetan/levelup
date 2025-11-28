// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProfileAvatar from './components/profile/ProfileAvatar';
import SignInCard from '@/app/components/auth/SignInCard';
import Dashboard from '@/app/components/dashboard/Dashboard';
import { useWeeklyStreak } from './hooks/useWeeklyStreak';
import type { User } from '@/lib/types';

import FloatingActionButton from '@/app/components/ui/FloatingActionButton';
import LogTimeSheet from '@/app/components/logs/LogTimeSheet';

function ArrowUpIcon() {
  return (
    <svg
      className="inline-block text-lime-400 align-middle -ml-[2px]"
      width="24"
      height="24"
      viewBox="0 0 24 22"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9 20V10H4L12 1L20 10H15V20H9Z" />
    </svg>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isLogSheetOpen, setIsLogSheetOpen] = useState(false);
  const { weeklyStreak } = useWeeklyStreak(user?.id ?? null);

  useEffect(() => {
    async function load() {
      try {
        const stored = localStorage.getItem('levelup_user');
        if (!stored) {
          setLoaded(true);
          return;
        }

        const parsed = JSON.parse(stored) as User;

        // Show cached user immediately
        setUser(parsed);

        // Re-sync from backend so weekly_goal stays in sync across devices
        const res = await fetch(`/api/profile?userId=${parsed.id}`);
        if (res.ok) {
          const data = await res.json();
          const freshUser = data.user as User;

          setUser(freshUser);
          localStorage.setItem('levelup_user', JSON.stringify(freshUser));
        }

        setLoaded(true);
      } catch (err) {
        console.error('Failed to sync user', err);
        setLoaded(true);
      }
    }

    load();
  }, []);

  // Disable scroll behind the sheet when it's open
  useEffect(() => {
    if (!isLogSheetOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isLogSheetOpen]);

  const handleLogout = () => {
    localStorage.removeItem('levelup_user');
    setUser(null);
  };

  if (!loaded) return null;

  const isAuthed = !!user;
  const canLogTime = isAuthed;

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* 🔥 TOP HEADER */}
      <header className="sticky top-0 z-20 w-full py-4 bg-black/80 backdrop-blur border-b border-white/10 shadow-md flex items-center justify-between px-4">
        {/* Left spacer to balance layout */}
        <div className="w-24" />

        {/* Center title */}
        <h1 className="text-3xl font-black flex items-center justify-center leading-none">
          <span className="leading-none">lvl</span>
          <ArrowUpIcon />
        </h1>

        {/* Right: Admin link (if admin) + profile avatar (if logged in) */}
        <div className="w-24 flex items-center justify-end gap-3">
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className="
              text-xs font-medium 
              px-3 py-1.5 
              rounded-lg 
              border border-white/20 
              text-white/80 
              hover:text-white hover:bg-white/10 
              transition"
            >
              Admin
            </Link>
          )}

{user && (
  <Link href="/profile" className="block">
    <ProfileAvatar
      user={user}
      weeklyStreak={weeklyStreak}
      size="sm"
      showBadge={false}
    />
  </Link>
)}

        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {isAuthed ? (
          <Dashboard user={user} onLogout={handleLogout} />
        ) : (
          <SignInCard onSignedIn={setUser} />
        )}
      </main>

      {/* Floating + button + sheet (only when logged in) */}
      {canLogTime && (
        <>
          {!isLogSheetOpen && (
            <FloatingActionButton onClick={() => setIsLogSheetOpen(true)} />
          )}

          {user && (
            <LogTimeSheet
              isOpen={isLogSheetOpen}
              onClose={() => setIsLogSheetOpen(false)}
              userId={user.id}
            />
          )}
        </>
      )}
    </div>
  );
}
