// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProfileAvatar from './components/profile/ProfileAvatar';
import SignInCard from '@/app/components/auth/SignInCard';
import { useWeeklyStreak } from './hooks/useWeeklyStreak';
import type { User } from '@/lib/types';

import FloatingActionButton from '@/app/components/ui/FloatingActionButton';
import LogTimeSheet from '@/app/components/logs/LogTimeSheet';

import PlayerHome from '@/app/components/home/PlayerHome';
import CoachHome from '@/app/components/home/CoachHome';
import AdminHome from '@/app/components/home/AdminHome';
import AdminDashboard from '@/app/components/admin/AdminDashboard';

function ArrowUpIcon() {
  return (
    <svg
      className="inline-block text-lime-400 align-middle -ml-[2px]"
      width="24"
      height="24"
      viewBox="0 0 24 22"
      fill="currentColor"
    >
      <path d="M9 20V10H4L12 1L20 10H15V20H9Z" />
    </svg>
  );
}

type HomeViewMode = 'player' | 'coach' | 'admin';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isLogSheetOpen, setIsLogSheetOpen] = useState(false);
  const { weeklyStreak } = useWeeklyStreak(user?.id ?? null);

  const [homeView, setHomeView] = useState<HomeViewMode>('coach');

  // Load user + refresh from backend
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

  // Load persisted home view for admins
  useEffect(() => {
    if (user?.role === 'admin') {
      const storedView = localStorage.getItem('levelup_homeViewMode');
      if (
        storedView === 'player' ||
        storedView === 'coach' ||
        storedView === 'admin'
      ) {
        setHomeView(storedView);
      } else {
        setHomeView('coach'); // default
      }
    }
  }, [user?.role]);

  // Persist home view when admin toggles it
  useEffect(() => {
    if (user?.role === 'admin') {
      localStorage.setItem('levelup_homeViewMode', homeView);
    }
  }, [homeView, user?.role]);

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

  // Decide which "home" to show when authenticated
  let homeContent: React.ReactNode;

  if (!isAuthed) {
    homeContent = <SignInCard onSignedIn={setUser} />;
} else if (user.role === 'admin') {
  if (homeView === 'player') {
    homeContent = <PlayerHome user={user} onLogout={handleLogout} />;
  } else if (homeView === 'coach') {
    homeContent = <CoachHome user={user} onLogout={handleLogout} />;
  } else {
    // Render the actual admin dashboard right in place
    homeContent = (
      <div className="w-full">
        <AdminDashboard />
      </div>
    );
  }
} else if (user.role === 'coach') {
    homeContent = <CoachHome user={user} onLogout={handleLogout} />;
  } else {
    // default to player view
    homeContent = <PlayerHome user={user} onLogout={handleLogout} />;
  }

  const showAdminViewSwitcher = isAuthed && user?.role === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* 🔥 TOP HEADER */}
      <header className="sticky top-0 z-20 w-full py-4 bg-black/80 backdrop-blur border-b border-white/10 shadow-md flex items-center justify-between px-4">
        {/* Left: for admins, show view switcher */}
        <div className="w-24 flex items-center">
          {showAdminViewSwitcher && (
            <div className="inline-flex items-center text-[10px] rounded-full border border-white/15 bg-white/5 px-1 py-0.5">
              {(['player', 'coach', 'admin'] as HomeViewMode[]).map((mode) => {
                const isActive = homeView === mode;
                const label =
                  mode === 'player'
                    ? 'Player'
                    : mode === 'coach'
                    ? 'Coach'
                    : 'Admin';

                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setHomeView(mode)}
                    className={`px-2 py-0.5 rounded-full transition text-[10px] ${
                      isActive
                        ? 'bg-white text-black font-semibold'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Center title */}
        <h1 className="text-3xl font-black flex items-center justify-center leading-none">
          <span className="leading-none">lvl</span>
          <ArrowUpIcon />
        </h1>

        {/* Right: Admin link (for convenience) + profile avatar */}
        <div className="w-24 flex items-center justify-end gap-3">

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
        {homeContent}
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
