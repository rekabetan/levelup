// app/profile/[id]/OtherProfileClient.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { User, LogEntry } from '@/lib/types';
import {
  AdminProfileAvatar,
  CoachProfileAvatar,
  PlayerProfileAvatar,
} from '@/app/components/profile/ProfileAvatar';
import { computeWeeklyStreak } from '@/lib/streak';

type OtherProfileClientProps = {
  userSlug: string;
};

export default function OtherProfileClient({
  userSlug,
}: OtherProfileClientProps) {
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const normalizedHandle =
          userSlug?.trim().replace(/^@/, '').toLowerCase() || null;

        const usersRes = await fetch('/api/users');
        let foundUser: User | null = null;
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          const users = (usersData.users || []) as User[];
          foundUser =
            (normalizedHandle &&
              users.find(
                (u) => u.handle?.toLowerCase() === normalizedHandle
              )) ||
            users.find((u) => u.id === userSlug) ||
            null;
        } else {
          console.error(
            'Error from /api/users:',
            usersRes.status,
            await usersRes.text()
          );
        }

        setUser(foundUser);

        if (foundUser?.id) {
          const logsRes = await fetch(`/api/logs?userId=${foundUser.id}`);
          if (logsRes.ok) {
            const logsData = await logsRes.json();
            setLogs((logsData.logs || []) as LogEntry[]);
          } else {
            console.error(
              'Error from /api/logs:',
              logsRes.status,
              await logsRes.text()
            );
            setLogs([]);
          }
        } else {
          setLogs([]);
        }
      } catch (err) {
        console.error('Error loading other profile:', err);
        setUser(null);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading profile…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white space-y-4">
        <p>User not found.</p>
        <Link href="/" className="text-lime-400 underline">
          ← Back
        </Link>
      </div>
    );
  }

  const weeklyStreak = computeWeeklyStreak(logs);
  const isAdmin = user.role === 'admin';
  const isCoach = user.role === 'coach';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 w-full py-4 bg-black/80 backdrop-blur border-b border-white/10 shadow flex items-center justify-between px-4">
        <Link
          href="/"
          className="text-sm text-white/70 hover:text-white flex items-center gap-1"
        >
          <span className="text-lg">←</span>
          <span>Back</span>
        </Link>

        <h1 className="text-lg font-semibold tracking-tight">Profile</h1>

        {/* spacer to keep title centered */}
        <div className="w-[72px]" />
      </header>

      <main className="flex-1 w-full px-6 py-6 max-w-lg mx-auto">
        <section className="flex flex-col items-center text-center relative">
          <div className="relative mb-6">
            {isAdmin ? (
              <AdminProfileAvatar user={user} size="lg" />
            ) : isCoach ? (
              <CoachProfileAvatar user={user} size="lg" />
            ) : (
              <PlayerProfileAvatar
                user={user}
                weeklyStreak={weeklyStreak}
                size="lg"
                showBadge={true}
              />
            )}
          </div>

          <div className="flex flex-col items-center space-y-1 mb-2">
            <p className="text-4xl font-semibold">{user.username}</p>
            {user.handle && (
              <p className="text-lg text-white/60">@{user.handle}</p>
            )}
          </div>
        </section>

        {/* You can add Recent / History sections here later */}
      </main>
    </div>
  );
}
