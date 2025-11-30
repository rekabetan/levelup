// app/profile/ProfileClient.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { User, LogEntry } from '@/lib/types';
import { computeWeeklyStreak, getWeekStart } from '@/lib/streak';
import ProfileAvatar from '@/app/components/profile/ProfileAvatar';
import TeamsSection from '@/app/components/coach/TeamsSection';
import FeedbackSection from '@/app/components/coach/FeedbackSection';
import { Mail } from 'lucide-react';
import Section from '@/components/ui/Section';
import AppHeader from '@/app/components/layout/AppHeader';

type CoachTeam = {
  id: string;
  name: string;
  age_group?: string | null;
  season_label?: string | null;
  player_count?: number | null;
  org_name?: string | null;
};

type ProfileContentProps = {
  user: User;
  logs: LogEntry[];
  loadingLogs: boolean;
};

type CoachProfileProps = {
  user: User;
  logs: LogEntry[];
};

type FeedbackItem = {
  id: string;
  body: string;
  created_at: string;
  is_read: boolean;
  coach_id: string;
  coach?: { username?: string | null } | null;
};

function formatAgeLabel(age?: string | number | null) {
  if (age === null || age === undefined) return null;
  const str = String(age);
  return str.toUpperCase().endsWith('U') ? str : `${str}U`;
}

function ProfileHeader({
  user,
  weeklyStreak,
  orgNameOverride,
  teamNameOverride,
  teamAgeOverride,
  showMessageButton = false,
  unreadCount = 0,
  onMessageClick,
}: {
  user: User;
  weeklyStreak: number;
  orgNameOverride?: string | null;
  teamNameOverride?: string | null;
  teamAgeOverride?: string | number | null;
  showMessageButton?: boolean;
  unreadCount?: number;
  onMessageClick?: () => void;
}) {
  const now = new Date();

  return (
    <section className="flex flex-col items-start text-left relative">
      <div className="relative mb-4 flex items-end gap-4">
        <ProfileAvatar
          user={user}
          weeklyStreak={weeklyStreak}
          size="lg"
          showBadge={true}
        />

        {showMessageButton && (
          <button
            type="button"
            onClick={onMessageClick}
            className="
              h-10 w-10 flex items-center justify-center
              rounded-full border border-white/30
              text-white/70
              hover:text-white hover:border-white/60 hover:bg-white/10
              transition
              active:scale-95
              relative
            "
            aria-label="Messages"
          >
            <Mail className="h-4 w-4" />
            {unreadCount > 0 && (
              <span
                className="
                  absolute -top-1 -right-1
                  h-3 w-3 rounded-full
                  bg-lime-400
                  ring-2 ring-black
                "
              />
            )}
          </button>
        )}
      </div>

      <div className="flex flex-col items-start space-y-1 mb-2">
        <p className="mt-4 text-4xl font-semibold">
          {user.username}{' '}
          <span className="text-xl text-white/60 font-medium">
            (@{user.handle})
          </span>
        </p>

        {(orgNameOverride ||
          teamNameOverride ||
          teamAgeOverride != null ||
          user.organization_name ||
          user.team_name ||
          user.team_age_group != null) && (
          <div className="mt-2 space-y-0.5">
            {(orgNameOverride ?? user.organization_name) && (
              <p className="text-md font-semibold uppercase tracking-wide text-white/40">
                {orgNameOverride ?? user.organization_name}
              </p>
            )}

            {(teamNameOverride || teamAgeOverride != null || user.team_name || user.team_age_group != null) && (
              <p className="text-md text-white/70">
                {teamNameOverride ?? user.team_name}
                {(teamAgeOverride != null || user.team_age_group != null) && (
                  <span className="text-white/70">
                    {' '}
                    | {formatAgeLabel(teamAgeOverride ?? user.team_age_group)}
                  </span>
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

type PlayerProfileProps = ProfileContentProps & {
  isSelf: boolean;
  onUnreadCountChange?: (count: number) => void;
};

function PlayerProfile({ user, logs, loadingLogs, isSelf, onUnreadCountChange }: PlayerProfileProps) {
  const now = new Date();
  const weeklyStreak = computeWeeklyStreak(logs);
  const [unreadCount, setUnreadCount] = useState(0);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackDetailOpen, setFeedbackDetailOpen] = useState(false);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);

  const weekStartMs = getWeekStart(now);
  const recentLogs = logs
    .filter((log) => new Date(log.created_at).getTime() >= weekStartMs)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const formatLogDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  const [viewYear, setViewYear] = useState(() => now.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => now.getMonth()); // 0 = Jan

  const year = viewYear;
  const month = viewMonth;

  const firstOfMonth = new Date(year, month, 1);
  const monthName = firstOfMonth.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const startWeekday = firstOfMonth.getDay(); // 0-6
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const todayDate = now.getDate();
  const isViewingCurrentMonth =
    viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const minutesByDate: Record<string, number> = {};
  for (const log of logs) {
    const d = new Date(log.created_at);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      minutesByDate[key] = (minutesByDate[key] || 0) + log.minutes;
    }
  }

  type CalendarCell =
    | {
        day: number;
        key: string;
        hasEnough: boolean;
        isToday: boolean;
      }
    | null;

  const calendarCells: CalendarCell[] = [];

  for (let i = 0; i < startWeekday; i++) {
    calendarCells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const key = dateObj.toISOString().slice(0, 10);
    const totalMinutes = minutesByDate[key] || 0;
    const hasEnough = totalMinutes >= 15;
    const isToday = isViewingCurrentMonth && day === todayDate;

    calendarCells.push({ day, key, hasEnough, isToday });
  }

  const goToPreviousMonth = () => {
    const prev = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(prev.getFullYear());
    setViewMonth(prev.getMonth());
  };

  const goToNextMonth = () => {
    const next = new Date(viewYear, viewMonth + 1, 1);
    const currentMonthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );
    if (next > currentMonthStart) return;
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const resetToCurrentMonth = () => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const isAtCurrentMonth =
    viewYear === now.getFullYear() && viewMonth === now.getMonth();

  // Load unread feedback for the signed-in player
  useEffect(() => {
    async function loadUnread() {
      if (!isSelf || user.role !== 'player') {
        setUnreadCount(0);
        onUnreadCountChange?.(0);
        return;
      }
      try {
        const res = await fetch(`/api/feedback/unread?playerId=${user.id}`);
        if (!res.ok) {
          setUnreadCount(0);
          onUnreadCountChange?.(0);
          return;
        }
        const data = await res.json();
        setUnreadCount(data.count ?? 0);
        onUnreadCountChange?.(data.count ?? 0);
      } catch {
        setUnreadCount(0);
        onUnreadCountChange?.(0);
      }
    }
    loadUnread();
  }, [isSelf, user.id, user.role, onUnreadCountChange]);

  const loadFeedbackList = async () => {
    if (!isSelf || user.role !== 'player') return;
    setFeedbackLoading(true);
    setFeedbackError(null);
    try {
      const res = await fetch(`/api/feedback/list?playerId=${user.id}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to load feedback');
      }
      const data = await res.json();
      setFeedbackItems((data.feedback || []) as FeedbackItem[]);
    } catch (err: any) {
      setFeedbackError(err?.message || 'Could not load feedback');
      setFeedbackItems([]);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Load feedback list on open + initial mount for section
  useEffect(() => {
    if (feedbackOpen) {
      loadFeedbackList();
    }
  }, [feedbackOpen]);

  useEffect(() => {
    loadFeedbackList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelf, user.id, user.role]);

  // Lock background scroll when feedback sheet open
  useEffect(() => {
    if (!feedbackOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [feedbackOpen]);

  const selectedFeedback =
    feedbackItems.find((f) => f.id === selectedFeedbackId) ??
    null;
  const hasUnread = feedbackItems.some((f) => !f.is_read);

  useEffect(() => {
    if (feedbackOpen) {
      setSelectedFeedbackId(null);
      setFeedbackDetailOpen(false);
    }
  }, [feedbackOpen]);

  useEffect(() => {
    if (!selectedFeedbackId) return;
    const stillExists = feedbackItems.some((f) => f.id === selectedFeedbackId);
    if (!stillExists) {
      setSelectedFeedbackId(null);
    }
  }, [feedbackItems, selectedFeedbackId]);

  const handleMarkRead = async () => {
    if (!selectedFeedback) return;
    try {
      const res = await fetch('/api/feedback/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId: selectedFeedback.id }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Could not mark as read');
      }

      setFeedbackItems((prev) =>
        prev.map((f) =>
          f.id === selectedFeedback.id ? { ...f, is_read: true } : f
        )
      );
      setUnreadCount((c) =>
        Math.max(0, c - (selectedFeedback.is_read ? 0 : 1))
      );
      // refresh list to reflect read state for other views
      loadFeedbackList();
    } catch (err: any) {
      setFeedbackError(err?.message || 'Could not mark as read');
    }
  };

  return (
    <main className="flex-1 w-full px-6 py-6 max-w-lg mx-auto space-y-10">
      <ProfileHeader
        user={user}
        weeklyStreak={weeklyStreak}
        showMessageButton={isSelf}
        unreadCount={unreadCount}
        onMessageClick={() => setFeedbackOpen(true)}
      />

      {/* RECENT */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-3xl font-bold text-white">Recent</h2>
          <Link
            href="/logs"
            className="text-sm font-semibold text-lime-400 hover:text-lime-300"
          >
            Show more →
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
          {loadingLogs ? (
            <p className="text-base text-white/60">
              Loading this week&apos;s activity…
            </p>
          ) : recentLogs.length === 0 ? (
            <p className="text-base text-white/60">No logs yet this week.</p>
          ) : (
            <ul className="space-y-3">
              {recentLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-start justify-between gap-3 border-b border-white/5 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-white/60">
                      {formatLogDate(log.created_at)}
                    </span>
                    {log.category && (
                      <span className="text-sm font-medium text-white/80 mt-0.5">
                        {log.category}
                      </span>
                    )}
                    {log.comment && (
                      <span className="text-sm text-white/70 mt-0.5">
                        {log.comment}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold">
                      {log.minutes} min
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* HISTORY / CALENDAR */}
      <section>
        <div className="mb-3">
          <h2 className="text-3xl font-bold text-white">History</h2>

          <div className="mt-6 mb-4 flex items-center justify-end gap-2 text-sm font-semibold text-white/70">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="w-7 h-7 flex items-center justify-center rounded-full border border-white/20 hover:bg-white/10 hover:text-white transition"
            >
              ‹
            </button>

            <span className="min-w-[140px] text-lg text-center text-white/60">
              {monthName}
            </span>

            <button
              type="button"
              onClick={goToNextMonth}
              disabled={isAtCurrentMonth}
              className={`
                w-7 h-7 flex items-center justify-center rounded-full border border-white/20 transition
                ${
                  isAtCurrentMonth
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-white/10 hover:text-white'
                }
              `}
            >
              ›
            </button>

            <button
              type="button"
              onClick={resetToCurrentMonth}
              disabled={isAtCurrentMonth}
              className={`
                ml-1 px-3 py-1 rounded-full border border-white/20 text-xs font-medium transition
                ${
                  isAtCurrentMonth
                    ? 'opacity-30 cursor-not-allowed text-white/40'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }
              `}
            >
              Today
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
          {loadingLogs ? (
            <p className="text-base text-white/60">
              Loading this month&apos;s activity…
            </p>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-2 mb-3 text-center text-sm font-medium text-white/60">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              <div className="grid grid-cols-7 gap-2 text-base">
                {calendarCells.map((cell, idx) => {
                  if (!cell) return <div key={idx} className="h-10" />;

                  const { day, hasEnough, isToday } = cell;
                  const base =
                    'flex items-center justify-center h-10 w-10 rounded-full mx-auto font-semibold transition';

                  const highlight = hasEnough
                    ? 'outline outline-2 outline-lime-400'
                    : 'bg-zinc-900 text-white/80';

                  const todayState = isToday
                    ? 'bg-lime-400 text-black'
                    : '';

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-center"
                    >
                      <div className={`${base} ${highlight} ${todayState}`}>
                        {day}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* FEEDBACK SECTION */}
      <FeedbackSection
        feedbackItems={feedbackItems}
        loading={feedbackLoading}
        error={feedbackError}
        onShowMore={() => setFeedbackOpen(true)}
        onSelect={(id) => {
          setSelectedFeedbackId(id);
          setFeedbackDetailOpen(true);
        }}
      />

      {feedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setFeedbackOpen(false)}
          />

          <div
            className="
              relative z-50 w-full max-w-md h-full
              rounded-none flex flex-col overflow-hidden
              bg-white/5 backdrop-blur-xl
              border border-white/10
              shadow-[0_-20px_60px_rgba(0,0,0,0.9)]
              px-6 pt-5 pb-7
            "
          >
            <h2 className="text-center text-xl font-bold uppercase tracking-wide text-white">
              Messages
            </h2>
            <p className="mt-1 text-center text-white/50 text-xs mb-4">
              Tap a message to read the full feedback.
            </p>

            <div
              className="flex-1 flex flex-col gap-4 overflow-y-auto"
              style={{
                paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 48px)',
              }}
            >
              {/* Feedback list */}
              <div className="space-y-2">
                {feedbackItems.length === 0 ? (
                  <p className="text-white/60 text-sm text-center">
                    No feedback yet.
                  </p>
                ) : (
                  feedbackItems.map((item) => {
                    const isActive = item.id === selectedFeedbackId;
                    const dateLabel = new Date(item.created_at).toLocaleDateString(
                      undefined,
                      { month: 'short', day: 'numeric', year: 'numeric' }
                    );
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedFeedbackId(item.id);
                          setFeedbackDetailOpen(true);
                        }}
                        className={`
                          w-full flex items-center gap-3 text-left rounded-xl px-3 py-2
                          border border-white/10
                          ${isActive ? 'bg-white/10' : 'bg-black/20 hover:bg-white/5'}
                        `}
                      >
                        {!item.is_read && (
                          <span
                            className={`
                              h-2.5 w-2.5 rounded-full flex-shrink-0
                              bg-lime-400
                            `}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`
                              text-sm flex-1 ${item.is_read ? 'text-white/70' : 'text-white font-semibold'}
                            `}
                          >
                            Feedback from {item.coach?.username || 'Coach'}
                          </p>
                        </div>
                        <span className="text-xs text-white/50 flex-shrink-0">
                          {dateLabel}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div
              className="mt-auto flex flex-col gap-3 sticky bottom-0 pt-2"
              style={{
                paddingBottom: 'calc(env(safe-area-inset-bottom, 12px) + 8px)',
                background: 'transparent',
              }}
            >
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(false)}
                  className="
                    flex-1 rounded-full border border-white/20
                    bg-transparent px-4 py-2 text-sm font-medium
                    text-white hover:bg-white/10 transition
                  "
                >
                  Close
                </button>

                {hasUnread && selectedFeedback && !selectedFeedback.is_read && (
                  <button
                    type="button"
                    onClick={handleMarkRead}
                    className="
                      flex-1 rounded-full px-4 py-2
                      bg-white text-black font-semibold
                      border border-white/20
                      hover:bg-white/90 transition
                    "
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {feedbackDetailOpen && selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setFeedbackDetailOpen(false)}
          />

          <div
            className="
              relative z-50 w-full max-w-md h-full
              rounded-none flex flex-col overflow-hidden
              bg-white/5 backdrop-blur-xl
              border border-white/10
              shadow-[0_-20px_60px_rgba(0,0,0,0.9)]
              px-6 pt-5 pb-7
            "
          >
            <h2 className="mb-4 text-center text-xl font-bold uppercase tracking-wide text-white">
              Feedback
            </h2>
            <p className="mb-4 text-center text-white/70 text-lg">
              from{' '}
              <span className="text-white font-semibold">
                {selectedFeedback.coach?.username || 'Coach'}
              </span>
            </p>
            <p className="text-center text-white/50 text-xs mb-4">
              {new Date(selectedFeedback.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>

            <div
              className="flex-1 flex flex-col gap-4 overflow-y-auto"
              style={{
                paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 48px)',
              }}
            >
              <div className="flex-1">
                <div className="rounded-2xl border border-white/15 bg-black/40 p-4 text-white/80 whitespace-pre-line">
                  {selectedFeedback.body}
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-3 sticky bottom-0 pt-2">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFeedbackDetailOpen(false)}
                    className="
                      flex-1 rounded-full border border-white/20
                      bg-transparent px-4 py-2 text-sm font-medium
                      text-white hover:bg-white/10 transition
                    "
                  >
                    Close
                  </button>

                  {!selectedFeedback.is_read && (
                    <button
                      type="button"
                      onClick={handleMarkRead}
                      className="
                        flex-1 rounded-full px-4 py-2
                        bg-white text-black font-semibold
                        border border-white/20
                        hover:bg-white/90 transition
                      "
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function CoachProfile({ user, logs }: CoachProfileProps) {
  const weeklyStreak = computeWeeklyStreak(logs);
  const [teams, setTeams] = useState<CoachTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [profileOrgName, setProfileOrgName] = useState<string | null>(null);
  const [profileTeamName, setProfileTeamName] = useState<string | null>(null);
  const [profileTeamAge, setProfileTeamAge] = useState<string | number | null>(null);

  useEffect(() => {
    async function loadTeams() {
      if (!user?.id) return;
      setLoadingTeams(true);
      try {
        const res = await fetch(`/api/coach/teams?coachId=${user.id}`);
        if (!res.ok) {
          console.error('Failed to fetch teams for coach profile', await res.text());
          setTeams([]);
          return;
        }
        const data = await res.json();
        const loadedTeams = (data.teams || []) as CoachTeam[];
        setTeams(loadedTeams);

        const primaryTeam = loadedTeams[0];
        if (primaryTeam) {
          setProfileTeamName(primaryTeam.name ?? null);
          setProfileTeamAge(primaryTeam.age_group ?? null);
          setProfileOrgName(primaryTeam.org_name ?? null);
        }
      } catch (err) {
        console.error('Error loading teams for coach profile', err);
        setTeams([]);
        setProfileOrgName(null);
        setProfileTeamName(null);
        setProfileTeamAge(null);
      } finally {
        setLoadingTeams(false);
      }
    }

    loadTeams();
  }, [user?.id]);

  const title = teams.length === 1 ? 'Team' : 'Teams';

  return (
    <main className="flex-1 w-full px-6 py-6 max-w-lg mx-auto space-y-10">
      <ProfileHeader
        user={user}
        weeklyStreak={weeklyStreak}
        orgNameOverride={profileOrgName}
        teamNameOverride={profileTeamName}
        teamAgeOverride={profileTeamAge}
      />

      <TeamsSection teams={teams} title={title} />

      {loadingTeams && (
        <p className="text-sm text-white/60">Loading teams…</p>
      )}
    </main>
  );
}

export default function ProfileClient() {
  const searchParams = useSearchParams();
  const viewedUserId = searchParams.get('id'); // ?id=... when tapped from leaderboard

  const [selfUser, setSelfUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [headerUnreadCount, setHeaderUnreadCount] = useState(0);

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

        if (viewedUserId) {
          // Viewing someone specific via ?id=...
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
            const found = users.find((u) => u.id === viewedUserId) || null;
            setViewUser(found);
          }
        } else {
          // Viewing own profile, no ?id=...
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
  }, [viewedUserId]);

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
    const message = viewedUserId
      ? 'User not found.'
      : "You’re not signed in.";

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg">{message}</p>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-sm font-medium hover:bg.white/10 transition"
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
        user={viewUser}
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
        unreadCount={viewUser.id === selfUser?.id && viewUser.role === 'player' ? headerUnreadCount : 0}
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
        />
      )}
    </div>
  );
}
