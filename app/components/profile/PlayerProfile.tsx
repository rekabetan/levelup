// app/components/profile/PlayerProfile.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { LogEntry, User } from '@/lib/types';
import { computeWeeklyStreak, getWeekStart } from '@/lib/streak';
import ProfileHeader from '@/app/components/profile/ProfileHeader';
import FeedbackSection from '@/app/components/coach/FeedbackSection';
import { List, ListItem } from '@/components/ui/List';
import { ChevronRight } from 'lucide-react';

type PlayerProfileProps = {
  user: User;
  logs: LogEntry[];
  loadingLogs: boolean;
  isSelf: boolean;
  onUnreadCountChange?: (count: number) => void;
  initialFeedbackId?: string | null;
  initialMessagesOpen?: boolean;
  openMessagesSignal?: number;
};

type FeedbackItem = {
  id: string;
  body: string;
  created_at: string;
  is_read: boolean;
  coach_id: string;
   status?: 'draft' | 'submitted';
  coach?: {
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    role?: string | null;
  } | null;
};

export default function PlayerProfile({
  user,
  logs,
  loadingLogs,
  isSelf,
  onUnreadCountChange,
  initialFeedbackId = null,
  initialMessagesOpen = false,
  openMessagesSignal,
}: PlayerProfileProps) {
  const now = new Date();
  const weeklyStreak = computeWeeklyStreak(logs);
  const [unreadCount, setUnreadCount] = useState(0);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackDetailOpen, setFeedbackDetailOpen] = useState(false);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const feedbackScrollRef = useRef<HTMLDivElement | null>(null);
  const COMMENT_PREVIEW_LIMIT = 30;

  const formatCoachLabel = (coach?: FeedbackItem['coach']) => {
    if (!coach) return 'Coach';

    const baseRole = coach.role ? coach.role.toLowerCase() : 'coach';
    const role = 'Coach';
    const first = coach.first_name?.trim();
    const lastInitial = coach.last_name?.trim()?.charAt(0)?.toUpperCase();

    if (first) {
      return lastInitial ? `${role} ${first} ${lastInitial}` : `${role} ${first}`;
    }

    const username = coach.username?.trim();
    return username ? `${role} ${username}` : role;
  };

  const weekStartMs = getWeekStart(now);
  const recentLogs = logs
    .filter((log) => new Date(log.created_at).getTime() >= weekStartMs)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  const formatLogDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
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
      const key = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
      ].join('-'); // local YYYY-MM-DD to avoid timezone shifts
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
    const key = [
      dateObj.getFullYear(),
      String(dateObj.getMonth() + 1).padStart(2, '0'),
      String(dateObj.getDate()).padStart(2, '0'),
    ].join('-');
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

  const closeFeedbackSheet = () => {
    setFeedbackDetailOpen(false);
    setDragStartY(null);
    setDragOffset(0);
  };

  const handleMessagesTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const scrollEl = messagesScrollRef.current;
    if (scrollEl && scrollEl.scrollTop > 2) {
      setDragStartY(null);
      return;
    }
    setDragStartY(e.touches[0].clientY);
  };

  const handleMessagesTouchMove = (e: React.TouchEvent) => {
    if (dragStartY === null || e.touches.length !== 1) return;
    const delta = e.touches[0].clientY - dragStartY;
    setDragOffset(Math.max(0, delta));
  };

  const handleMessagesTouchEnd = () => {
    const shouldClose = dragOffset > 100;
    if (shouldClose) {
      setFeedbackOpen(false);
    }
    setDragOffset(0);
    setDragStartY(null);
  };

  // Swipe-to-close disabled; keep helpers no-op

  // Lock background scroll while the sheet is open
  useEffect(() => {
    if (!feedbackDetailOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [feedbackDetailOpen]);

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
        return;
      }
      try {
        const res = await fetch(`/api/feedback/unread?playerId=${user.id}`);
        if (!res.ok) {
          setUnreadCount(0);
          return;
        }
        const data = await res.json();
        setUnreadCount(data.count ?? 0);
      } catch {
        setUnreadCount(0);
      }
    }
    loadUnread();
  }, [isSelf, user.id, user.role, onUnreadCountChange]);

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

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
    if (initialMessagesOpen) {
      setFeedbackOpen(true);
    }
  }, [initialMessagesOpen]);

  useEffect(() => {
    if (!openMessagesSignal) return;
    setFeedbackOpen(true);
  }, [openMessagesSignal]);

  // If a feedbackId was requested (e.g., via notification), open it directly when loaded
  useEffect(() => {
    if (!initialFeedbackId) return;
    const match = feedbackItems.find((f) => f.id === initialFeedbackId);
    if (match) {
      setFeedbackOpen(false);
      setSelectedFeedbackId(match.id);
      setFeedbackDetailOpen(true);
    }
  }, [feedbackItems, initialFeedbackId]);

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
        subtitle="Parent-managed account"
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
                  className="flex items-center justify-between gap-3 border-b border-white/5 py-2 last:border-b-0 last:pb-0 min-h-[52px]"
                >
                  <div className="flex flex-col flex-1 min-w-0 pr-3 justify-center">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold text-white truncate">
                        {formatLogDate(log.created_at)}
                      </span>
                      {log.category && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/80 whitespace-nowrap">
                          {log.category}
                        </span>
                      )}
                    </div>
                    {log.comment && (
                      <div className="mt-0.5 flex items-start gap-2 text-sm text-white/70">
                        {(() => {
                          const isLong = log.comment.length > COMMENT_PREVIEW_LIMIT;
                          const isExpanded = expandedLogIds.has(log.id);
                          const shouldTruncate = isLong && !isExpanded;
                          const previewText = shouldTruncate
                            ? `${log.comment.slice(0, COMMENT_PREVIEW_LIMIT)}…`
                            : log.comment;
                          return (
                            <>
                              <span
                                className={`flex-1 min-w-0 ${
                                  isExpanded
                                    ? 'whitespace-pre-wrap'
                                    : 'whitespace-pre-wrap inline-block align-middle'
                                }`}
                              >
                                {previewText}
                              </span>
                              {isLong && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedLogIds((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(log.id)) {
                                        next.delete(log.id);
                                      } else {
                                        next.add(log.id);
                                      }
                                      return next;
                                    })
                                  }
                                  className="ml-auto text-xs font-semibold text-lime-400 hover:text-lime-300 inline-flex items-center shrink-0"
                                >
                                  {isExpanded ? 'Show less' : 'Show more'}
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <div className="w-16 shrink-0 flex flex-col items-end justify-center text-right">
                    <span className="text-lg font-semibold leading-none">
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
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-3xl font-bold text-white leading-none">History</h2>

          <div className="flex items-center justify-end gap-2 text-sm font-semibold text-white/70 self-center">
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
              relative z-50 w-full max-w-md h-[90vh]
              rounded-t-3xl flex flex-col overflow-hidden
              bg-white/5 backdrop-blur-xl
              border border-white/10
              shadow-[0_-20px_60px_rgba(0,0,0,0.9)]
              px-6 pt-4 pb-7
            "
            style={{
              transform: `translateY(${dragOffset}px)`,
              transition: dragStartY === null ? 'transform 150ms ease-out' : 'none',
            }}
            onTouchStart={handleMessagesTouchStart}
            onTouchMove={handleMessagesTouchMove}
            onTouchEnd={handleMessagesTouchEnd}
            onTouchCancel={handleMessagesTouchEnd}
          >
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-white/30" />
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
              ref={messagesScrollRef}
            >
              {/* Feedback list */}
              {feedbackItems.length === 0 ? (
                <p className="text-white/60 text-sm text-center">
                  No feedback yet.
                </p>
              ) : (
                <div className="divide-y divide-white/10 border-b border-white/10">
                  {feedbackItems.map((item) => {
                    const isActive = item.id === selectedFeedbackId;
                    const dateLabel = new Date(item.created_at).toLocaleDateString(
                      undefined,
                      { month: 'short', day: 'numeric' }
                    );
                    const coachLabel = formatCoachLabel(item.coach);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedFeedbackId(item.id);
                          setFeedbackDetailOpen(true);
                        }}
                        className={`
                          w-full flex items-center gap-3 text-left
                          ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}
                          px-2 py-4
                        `}
                      >
                        {!item.is_read && (
                          <span className="h-2.5 w-2.5 rounded-full bg-lime-400 flex-shrink-0" />
                        )}
                        <div className="flex items-center justify-between flex-1 min-w-0 gap-3">
                          <div className="flex flex-col min-w-0">
                            <p
                              className={`text-sm ${
                                isActive || !item.is_read
                                  ? 'text-white font-semibold'
                                  : 'text-white/70'
                              }`}
                            >
                              Feedback from {coachLabel}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <p className="text-xs text-white/50">{dateLabel}</p>
                            <ChevronRight className="h-4 w-4 text-white/50" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
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
                    w-full rounded-full border border-white/20
                    bg-transparent px-4 py-2 text-sm font-medium
                    text-white hover:bg-white/10 transition
                  "
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {feedbackDetailOpen && selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={closeFeedbackSheet}
          />

          <div
            className="
              relative z-50 w-full h-full
              flex flex-col overflow-hidden min-h-0
              bg-gradient-to-b from-black/90 via-black/95 to-black
              px-5 pt-6 pb-7
            "
            style={{
              transform: `translateY(0px)`,
              transition: 'transform 150ms ease-out',
            }}
          >
            <div className="space-y-6 flex-1 overflow-y-auto min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex items-start justify-between sticky top-0 z-10 pb-4 bg-gradient-to-b from-black via-black/95 to-black/80">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">
                    Feedback
                  </p>
                  <p className="text-xl font-semibold text-white">
                    {formatCoachLabel(selectedFeedback.coach)}
                  </p>
                  <p className="text-xs text-white/50">
                    {new Date(selectedFeedback.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div
                className="
                  w-full rounded-2xl
                  bg-white/5 border border-white/10
                  text-white/80 leading-relaxed whitespace-pre-line
                  px-5 py-4 shadow-lg shadow-black/40 backdrop-blur-sm
                "
              >
                {selectedFeedback.body}
              </div>
            </div>

            <div
              className="mt-6 pt-3"
              style={{
                paddingBottom: 'calc(env(safe-area-inset-bottom, 12px))',
              }}
            >
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeFeedbackSheet}
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
      )}
    </main>
  );
}
