// app/profile/ProfileClient.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { User, LogEntry } from '@/lib/types';
import { computeWeeklyStreak } from '@/lib/streak';
import AppHeader from '@/app/components/layout/AppHeader';
import PlayerProfile from '@/app/components/profile/PlayerProfile';
import CoachProfile from '@/app/components/profile/CoachProfile';

type ProfileClientProps = {
  initialHandle?: string | null;
  initialUserId?: string | null;
};

export default function ProfileClient({
  initialHandle = null,
  initialUserId = null,
}: ProfileClientProps = {}) {
  const searchParams = useSearchParams();
  const viewedUserHandle =
    initialHandle ??
    searchParams.get('handle'); // ?handle=... when tapped from leaderboard
  const viewedUserId =
    initialUserId ??
    searchParams.get('id'); // legacy fallback
  const initialFeedbackId = searchParams.get('feedbackId');
  const initialMessagesOpen = searchParams.get('openMessages') === '1';

  const [selfUser, setSelfUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [headerUnreadCount, setHeaderUnreadCount] = useState(0);
  const [openMessagesSignal, setOpenMessagesSignal] = useState(0);

  // ---------- Load logged-in user from localStorage ----------
  useEffect(() => {
    const stored = localStorage.getItem('levelup_user');
    if (!stored) {
      setSelfUser(null);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as User;
      setSelfUser(parsed);
    } catch {
      console.error('Failed to parse levelup_user from localStorage');
      localStorage.removeItem('levelup_user');
      setSelfUser(null);
    }
  }, []);

  // ---------- Load the user whose profile we're viewing ----------
  useEffect(() => {
    async function loadUser() {
      try {
        setUserLoaded(false);

        if (viewedUserHandle || viewedUserId) {
          // Viewing someone specific via ?handle=... (or legacy ?id=...)
          const res = await fetch('/api/users');
          if (!res.ok) {
            console.error(
              'Error from /api/users:',
              res.status,
              await res.text()
            );
            setViewUser(null);
          } else {
            const data = await res.json();
            const users = (data.users || []) as User[];
            const normalizedHandle =
              viewedUserHandle?.replace('@', '').toLowerCase() ?? null;

            const found =
              (normalizedHandle &&
                users.find(
                  (u) => u.handle?.toLowerCase() === normalizedHandle
                )) ||
              users.find((u) => u.id === viewedUserId) ||
              null;
            setViewUser(found);
          }
        } else {
          // Viewing own profile, no ?handle=... or ?id=...
          const stored = localStorage.getItem('levelup_user');
          if (!stored) {
            setViewUser(null);
          } else {
            try {
              const parsed = JSON.parse(stored) as User;
              setViewUser(parsed);
            } catch {
              console.error('Failed to parse levelup_user for viewUser');
              localStorage.removeItem('levelup_user');
              setViewUser(null);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load profile user', err);
        setViewUser(null);
      } finally {
        setUserLoaded(true);
      }
    }

    loadUser();
  }, [viewedUserHandle, viewedUserId]);

  // ---------- Load logs for the viewed user ----------
  useEffect(() => {
    if (!viewUser) return;
    const userId = viewUser.id;

    async function loadLogs() {
      try {
        setLoadingLogs(true);
        const res = await fetch(`/api/logs?userId=${userId}`);
        if (!res.ok) {
          console.error(
            'Error from /api/logs:',
            res.status,
            await res.text()
          );
          setLogs([]);
          return;
        }
        const data = await res.json();
        setLogs((data.logs || []) as LogEntry[]);
      } catch (err) {
        console.error('Failed to load logs for profile', err);
        setLogs([]);
      } finally {
        setLoadingLogs(false);
      }
    }

    loadLogs();
  }, [viewUser?.id]);

  // ---------- Early returns ----------
  if (!userLoaded) return null;

  if (!viewUser) {
    const message = viewedUserHandle || viewedUserId
      ? 'User not found.'
      : "You’re not signed in.";

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg">{message}</p>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/10 transition"
          >
            ← Back to LevelUp
          </Link>
        </div>
      </div>
    );
  }

  const hasLoggedInUser = !!selfUser;
  const viewRole = viewUser.role?.toLowerCase() || null;
  const selfRole = selfUser?.role?.toLowerCase() || null;
  const isCoachView =
    viewRole === 'coach' ||
    viewRole === 'admin' ||
    (!viewRole && (selfRole === 'coach' || selfRole === 'admin'));
  const headerWeeklyStreak = computeWeeklyStreak(logs);

  const handleSignOut = () => {
    localStorage.removeItem('levelup_user');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <AppHeader
        user={selfUser ?? viewUser}
        weeklyStreak={headerWeeklyStreak}
        leftContent={
          <Link
            href="/"
            className="text-sm text-white/70 hover:text-white flex items-center gap-1"
          >
            <span className="text-lg">←</span>
            <span>Back</span>
          </Link>
        }
        showSignOut={hasLoggedInUser}
        onSignOut={handleSignOut}
        messagesUnreadCount={
          viewUser.id === selfUser?.id && viewUser.role === 'player'
            ? headerUnreadCount
            : 0
        }
        notificationsUnreadCount={0}
        onMessagesClick={() => setOpenMessagesSignal((prev) => prev + 1)}
      />

      {isCoachView ? (
        <CoachProfile user={viewUser} logs={logs} />
      ) : (
        <PlayerProfile
          user={viewUser}
          logs={logs}
          loadingLogs={loadingLogs}
          isSelf={viewUser.id === selfUser?.id}
          onUnreadCountChange={(count) => setHeaderUnreadCount(count)}
          initialFeedbackId={initialFeedbackId}
          initialMessagesOpen={initialMessagesOpen}
          openMessagesSignal={openMessagesSignal}
        />
      )}
    </div>
  );
}
