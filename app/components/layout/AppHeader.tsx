// app/components/layout/AppHeader.tsx
'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Bell, MessageCircle } from 'lucide-react';
import type { User } from '@/lib/types';
import {
  AdminProfileAvatar,
  CoachProfileAvatar,
  PlayerProfileAvatar,
} from '@/app/components/profile/ProfileAvatar';

type HomeViewMode = 'player' | 'coach' | 'admin';

type AppHeaderProps = {
  user: User | null;
  weeklyStreak?: number | null;
  homeView?: HomeViewMode;
  onHomeViewChange?: (mode: HomeViewMode) => void;
  showAdminViewSwitcher?: boolean;
  leftContent?: ReactNode;
  rightExtras?: ReactNode;
  showSignOut?: boolean;
  onSignOut?: () => void;
  messagesUnreadCount?: number;
  notificationsUnreadCount?: number;
  onNotificationsClick?: () => void;
  onMessagesClick?: () => void;
};

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

export default function AppHeader({
  user,
  weeklyStreak,
  homeView,
  onHomeViewChange,
  showAdminViewSwitcher,
  leftContent,
  rightExtras,
  showSignOut,
  onSignOut,
  messagesUnreadCount = 0,
  notificationsUnreadCount = 0,
  onNotificationsClick,
  onMessagesClick,
}: AppHeaderProps) {
  const renderAdminSwitcher =
    showAdminViewSwitcher &&
    user?.role === 'admin' &&
    homeView &&
    onHomeViewChange;

  const streakValue = typeof weeklyStreak === 'number' ? weeklyStreak : 0;
  const isAdmin = user?.role === 'admin';
  const isCoach = user?.role === 'coach';
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      if (
        accountMenuRef.current &&
        event.target instanceof Node &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 w-full py-4 bg-black/80 backdrop-blur border-b border-white/10 shadow-md flex items-center justify-between px-4 relative">
      {/* Left: either admin switcher or custom content */}
      <div className="min-w-[96px] flex items-center">
        {renderAdminSwitcher ? (
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
                  onClick={() => onHomeViewChange(mode)}
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
        ) : (
          leftContent || <div className="h-6" />
        )}
      </div>

      {/* Center title */}
      <h1 className="text-3xl font-black flex items-center justify-center leading-none absolute left-1/2 -translate-x-1/2">
        <span className="leading-none">lvl</span>
        <ArrowUpIcon />
      </h1>

      {/* Right: optional sign out, notification, avatar */}
      <div className="min-w-[96px] flex items-center justify-end gap-2">
        {rightExtras}

        {user && (
          <div className="flex items-center gap-2 relative" ref={accountMenuRef}>
            <button
              type="button"
              className="relative h-10 w-10 flex items-center justify-center text-white/70 hover:text-white transition"
              aria-label="Messages"
              onClick={onMessagesClick}
            >
              <MessageCircle className="h-5 w-5" />
              {messagesUnreadCount > 0 && (
                <span className="absolute top-[7.5px] right-2.5 h-2.5 w-2.5 rounded-full bg-lime-400" />
              )}
            </button>

            {showSignOut && onSignOut ? (
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                className="block"
                aria-label="Account menu"
              >
                {isAdmin ? (
                  <AdminProfileAvatar user={user} size="sm" />
                ) : isCoach ? (
                  <CoachProfileAvatar user={user} size="sm" />
                ) : (
                  <PlayerProfileAvatar
                    user={user}
                    weeklyStreak={streakValue}
                    size="sm"
                    showBadge={false}
                  />
                )}
              </button>
            ) : (
              <Link href="/profile" className="block">
                {isAdmin ? (
                  <AdminProfileAvatar user={user} size="sm" />
                ) : isCoach ? (
                  <CoachProfileAvatar user={user} size="sm" />
                ) : (
                  <PlayerProfileAvatar
                    user={user}
                    weeklyStreak={streakValue}
                    size="sm"
                    showBadge={false}
                  />
                )}
              </Link>
            )}

            {showSignOut && onSignOut && isAccountMenuOpen && (
              <div
                className="
                  absolute right-0 top-full mt-2
                  rounded-xl border border-white/10
                  bg-black/90 backdrop-blur
                  shadow-lg shadow-black/40
                  px-3 py-2
                  min-w-[140px]
                "
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    onSignOut();
                  }}
                  className="w-full text-left text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-lg px-3 py-2 transition"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
