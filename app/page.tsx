// app/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock, Pause as PauseIcon, RotateCcw, Play, CirclePlus, CircleMinus, X } from 'lucide-react';
import type { Category } from '@/lib/types';
import SignInCard from '@/app/components/auth/SignInCard';
import { useWeeklyStreak } from './hooks/useWeeklyStreak';
import type { User } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';

import FloatingActionButton from '@/app/components/ui/FloatingActionButton';
import LogTimeSheet from '@/app/components/logs/LogTimeSheet';
import NotificationSheet, {
  type NotificationItem,
} from '@/app/components/ui/NotificationSheet';

import PlayerHome from '@/app/components/home/PlayerHome';
import CoachHome from '@/app/components/home/CoachHome';
import AdminHome from '@/app/components/home/AdminHome';
import AdminDashboard from '@/app/components/admin/AdminDashboard';
import AppHeader from '@/app/components/layout/AppHeader';
type TimerEntry = {
  id: string;
  category: Category;
  minutes: number;
  comment: string;
};

const CATEGORY_OPTIONS: Category[] = [
  'Baserunning',
  'Catching',
  'Hitting',
  'Infield',
  'Outfield',
  'Pitching',
  'Fitness',
  'Mindset',
];
const DEFAULT_CATEGORY: Category = 'Baserunning';
type HomeViewMode = 'player' | 'coach' | 'admin';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isLogSheetOpen, setIsLogSheetOpen] = useState(false);
  const { weeklyStreak } = useWeeklyStreak(user?.id ?? null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(30 * 60 * 1000);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerDragStartY = useRef<number | null>(null);
  const detailDragStartY = useRef<number | null>(null);
  const [isTimerCollapsed, setIsTimerCollapsed] = useState(false);
  const [isTimerCollapsing, setIsTimerCollapsing] = useState(false);
  const [isTimerDetailsOpen, setIsTimerDetailsOpen] = useState(false);
  const [isTimerDetailsCollapsed, setIsTimerDetailsCollapsed] = useState(false);
  const [isTimerDetailsFull, setIsTimerDetailsFull] = useState(false);
  const [timerCapturedMinutes, setTimerCapturedMinutes] = useState<number | null>(null);
  const [timerEntries, setTimerEntries] = useState<TimerEntry[]>([]);
  const categoryButtonRefs = useRef<Record<string, Partial<Record<Category, HTMLButtonElement | null>>>>({});
  const categoryScrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [loggingSplits, setLoggingSplits] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const unreadNotifications = notifications.filter((n) => !n.is_read).length;

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
          if (data.user) {
            const freshUser = data.user as User;
            setUser(freshUser);
            localStorage.setItem('levelup_user', JSON.stringify(freshUser));
          } else {
            // If backend doesn't return a user, keep the cached one
            console.warn('Profile sync returned no user; keeping cached user');
          }
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

  // Disable scroll behind any sheet when open
  useEffect(() => {
    const shouldLock =
      isLogSheetOpen ||
      (isTimerOpen && !isTimerCollapsed) ||
      isTimerDetailsOpen;
    if (!shouldLock) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalOverscroll = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.overscrollBehavior = originalOverscroll;
    };
  }, [isLogSheetOpen, isTimerOpen, isTimerCollapsed, isTimerDetailsOpen]);

  // Load notifications (placeholder: reuse feedback unread for now)
  useEffect(() => {
    const loadNotifications = async () => {
      if (!notificationsOpen || !user) return;
      setNotificationsLoading(true);
      try {
        const res = await fetch('/api/feedback/list?playerId=' + user.id);
        if (!res.ok) {
          setNotifications([]);
        } else {
          const data = await res.json();
          const items = (data.feedback || []) as any[];
          const mapped: NotificationItem[] = items.map((f) => ({
            id: f.id,
            title: '',
            body: f.body ?? null,
            created_at: f.created_at,
            is_read: !!f.is_read,
            kind: 'feedback',
            coach_first_name: f.coach?.first_name ?? null,
            coach_last_name: f.coach?.last_name ?? null,
            coach_username: f.coach?.username ?? null,
            coach_role: f.coach?.role ?? null,
          }));
          setNotifications(mapped);
        }
      } catch {
        setNotifications([]);
      } finally {
        setNotificationsLoading(false);
      }
    };
    loadNotifications();
  }, [notificationsOpen, user]);

  // Snap selected category into view horizontally
  useEffect(() => {
    if (!isTimerDetailsOpen) return;
    requestAnimationFrame(() => {
      timerEntries.forEach((entry) => {
        const el = categoryButtonRefs.current[entry.id]?.[entry.category];
        const container = categoryScrollRefs.current[entry.id];
        if (el && container) {
          el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
    });
  }, [timerEntries, isTimerDetailsOpen]);

  // Timer tick
  useEffect(() => {
    if (!isTimerOpen || timerStart === null) return;
    const tick = () => {
      setElapsedMs(Date.now() - timerStart);
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerOpen, timerStart]);

  // Clamp entry minutes if total changes
  useEffect(() => {
    const total = timerCapturedMinutes ?? 0;
    setTimerEntries((prev) => {
      let remaining = total;
      return prev.map((entry) => {
        const minutes = Math.min(entry.minutes, Math.max(0, remaining));
        remaining = Math.max(0, remaining - minutes);
        return { ...entry, minutes };
      });
    });
  }, [timerCapturedMinutes]);

  // Load unread feedback for players so the bell badge is accurate
  useEffect(() => {
    const loadUnread = async () => {
      if (!user || user.role !== 'player') {
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
    };

    loadUnread();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('levelup_user');
    setUser(null);
  };

  const handleTimerStart = (expand: boolean = true) => {
    const now = Date.now();
    // If timer sheet not open, start fresh
    if (!isTimerOpen) {
      setTimerStart(now - elapsedMs);
      if (expand) {
        setIsTimerOpen(true);
        setIsTimerCollapsed(false);
      }
      return;
    }
    // Resume from paused elapsed
    setTimerStart(now - elapsedMs);
    if (expand) {
      setIsTimerCollapsed(false);
    }
  };

  const handleTimerStop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = null;
  };

  const handleTimerReset = () => {
    setElapsedMs(0);
    setTimerStart(Date.now());
  };

  const closeTimerSheet = (reset: boolean = true) => {
    setIsTimerOpen(false);
    handleTimerStop();
    if (reset) {
      setTimerStart(null);
      setElapsedMs(0);
    }
    setIsTimerCollapsed(false);
    setIsTimerCollapsing(false);
  };

  const closeTimerDetails = () => {
    setIsTimerDetailsOpen(false);
    setIsTimerDetailsCollapsed(false);
    setIsTimerDetailsFull(false);
    setTimerCapturedMinutes(null);
    setTimerEntries([]);
  };
  const collapseTimerDetails = () => {
    setIsTimerDetailsCollapsed(true);
    setIsTimerDetailsOpen(false);
    setIsTimerDetailsFull(false);
  };

  const handleTimerSubmit = () => {
    const captured =
      elapsedMs > 0 ? Math.max(1, Math.round(elapsedMs / 60000)) : null;
    setTimerCapturedMinutes(captured);
    setTimerEntries([
      {
        id: `entry-${Date.now()}`,
        category: DEFAULT_CATEGORY,
        minutes: captured ?? 0,
        comment: '',
      },
    ]);
    closeTimerSheet(false);
    setIsTimerDetailsOpen(true);
    setIsTimerDetailsCollapsed(false);
    setIsTimerDetailsFull(false);
  };

  const collapseTimerSheet = () => {
    if (!isTimerOpen || isTimerCollapsed) return;
    setIsTimerCollapsing(true);
    setTimeout(() => {
      setIsTimerCollapsed(true);
      setIsTimerCollapsing(false);
    }, 200);
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
      <AppHeader
        user={user}
        weeklyStreak={weeklyStreak}
        homeView={homeView}
        onHomeViewChange={setHomeView}
        showAdminViewSwitcher={showAdminViewSwitcher}
        messagesUnreadCount={user?.role === 'player' ? unreadCount : 0}
        notificationsUnreadCount={unreadNotifications}
        onMessagesClick={() => {
          window.location.href = '/profile?openMessages=1';
        }}
        onNotificationsClick={() => setNotificationsOpen(true)}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {homeContent}
      </main>

      {/* Floating + button + sheet (only when logged in) */}
      {canLogTime && (
        <>
          {/* Timer FAB */}
          {!isTimerOpen && (
            <FloatingActionButton
              onClick={() => handleTimerStart()}
              positionClassName="bottom-24 right-6"
              variant="secondary"
              icon={<Clock className="h-6 w-6" />}
              ariaLabel="Start timer"
            />
          )}
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

      <NotificationSheet
        open={notificationsOpen}
        notifications={notifications}
        loading={notificationsLoading}
        onClose={() => setNotificationsOpen(false)}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        }
        onSelect={(id) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
          );
          setNotificationsOpen(false);
          if (id) {
            window.location.href = `/profile?feedbackId=${encodeURIComponent(id)}`;
          } else {
            window.location.href = '/profile';
          }
        }}
      />

      {isTimerOpen && isTimerCollapsed && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
          <div
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg p-3 flex items-center gap-3"
            onClick={() => setIsTimerCollapsed(false)}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeTimerSheet();
                setTimerCapturedMinutes(null);
                setTimerEntries([]);
                setIsTimerDetailsOpen(false);
                setIsTimerDetailsCollapsed(false);
                setIsTimerDetailsFull(false);
              }}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
              aria-label="Close timer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex-1 flex justify-center">
              <span className="text-2xl font-black text-lime-400">
                {new Date(elapsedMs).toISOString().substr(11, 8)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTimerReset();
                }}
                className="px-3 py-2 rounded-full border border-white/20 text-white hover:bg-white/10 transition"
                aria-label="Reset timer"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              {timerStart === null ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTimerStart(false);
                  }}
                  className="px-3 py-2 rounded-full bg-lime-400 text-black hover:bg-lime-300 transition"
                  aria-label="Resume timer"
                >
                  <Play className="h-5 w-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTimerStart(null);
                  }}
                  className="px-3 py-2 rounded-full bg-white text-black border border-white/20 hover:bg-white/90 transition"
                  aria-label="Pause timer"
                >
                  <PauseIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {isTimerOpen && (!isTimerCollapsed || isTimerCollapsing) && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              // Collapse instead of fully closing when backdrop tapped
              setIsTimerCollapsing(true);
              setTimeout(() => {
                setIsTimerCollapsing(false);
                setIsTimerCollapsed(true);
              }, 200);
            }}
          />

          <div
            className={`
              relative z-50 w-full max-w-md
              rounded-t-3xl flex flex-col
              bg-white/5 backdrop-blur-xl min-h-[50vh]
              border border-white/10
              shadow-[0_-20px_60px_rgba(0,0,0,0.9)]
              px-6 pt-5 pb-7
              transform transition-all duration-400 ease-out
              ${isTimerCollapsing ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}
            `}
              onTouchStart={(e) => {
                timerDragStartY.current = e.touches[0].clientY;
              }}
              onTouchEnd={(e) => {
                if (timerDragStartY.current === null) return;
                const delta = e.changedTouches[0].clientY - timerDragStartY.current;
                if (delta > 80) {
                  collapseTimerSheet();
                }
                timerDragStartY.current = null;
              }}
            >
            <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-white/20" />
            <h2 className="mb-6 text-center text-xl font-bold uppercase tracking-wide text-white">
              Timer
            </h2>

            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="text-6xl font-black text-lime-400 leading-none">
                {new Date(elapsedMs).toISOString().substr(11, 8)}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleTimerReset}
                  className="px-4 py-2 rounded-full border border-white/20 text-sm font-medium text-white hover:bg-white/10 transition"
                >
                  Reset
                </button>
                {timerStart === null ? (
                  <button
                    type="button"
                    onClick={() => handleTimerStart()}
                    className={`px-4 py-2 rounded-full font-semibold transition ${
                      elapsedMs > 0
                        ? 'bg-white text-black border border-white/20 hover:bg-white/90'
                        : 'bg-lime-400 text-black hover:bg-lime-300'
                    }`}
                  >
                    {elapsedMs > 0 ? 'Resume' : 'Start'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setTimerStart(null);
                    }}
                    className="px-4 py-2 rounded-full bg-white text-black font-semibold border border-white/20 hover:bg-white/90 transition"
                  >
                    Pause
                  </button>
                )}
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsTimerOpen(false);
                    handleTimerStop();
                    setTimerStart(null);
                    setElapsedMs(0);
                  }}
                  className="
                    flex-1 rounded-full px-4 py-2
                    border border-white/20 text-white
                    hover:bg-white/10 transition
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleTimerSubmit}
                  className="
                    flex-1 rounded-full px-4 py-2
                    bg-white text-black font-semibold
                    border border-white/20
                    hover:bg-white/90 transition
                  "
                >
                  Log
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isTimerDetailsOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={collapseTimerDetails}
          />

          <div
            className={`
              relative z-50 w-full max-w-md
              rounded-t-3xl flex flex-col
              bg-white/5 backdrop-blur-xl
              ${isTimerDetailsFull ? 'min-h-screen max-h-screen' : `min-h-[45vh] ${timerEntries.length >= 3 ? 'max-h-[95vh]' : 'max-h-[85vh]'}`}
              border border-white/10
              shadow-[0_-20px_60px_rgba(0,0,0,0.9)]
              px-6 pt-5 pb-7
            `}
            onTouchStart={(e) => {
              detailDragStartY.current = e.touches[0].clientY;
            }}
            onTouchEnd={(e) => {
              if (detailDragStartY.current === null) return;
              const delta = e.changedTouches[0].clientY - detailDragStartY.current;
              if (delta > 80) {
                collapseTimerDetails();
              } else if (delta < -80) {
                setIsTimerDetailsFull(true);
              }
              detailDragStartY.current = null;
            }}
          >
            <div className="relative flex items-center mb-4">
              <button
                type="button"
                onClick={() => {
                  setIsTimerDetailsOpen(false);
                  setIsTimerOpen(true);
                  setIsTimerCollapsed(false);
                  setIsTimerCollapsing(false);
                  setTimerStart(null); // paused state
                }}
                className="relative z-10 flex items-center gap-1 text-sm text-white/70 hover:text-white"
              >
                <span className="text-lg">←</span>
                <span>Back to timer</span>
              </button>

              <div className="absolute left-1/2 -translate-x-1/2 h-1.5 w-16 rounded-full bg-white/20 pointer-events-none" />

              <button
                type="button"
                onClick={() => {
                  const total = timerCapturedMinutes ?? 0;
                  const currentTotal = timerEntries.reduce((sum, e) => sum + e.minutes, 0);
                  const remaining = Math.max(0, total - currentTotal);
                  setTimerEntries((prev) => [
                    ...prev,
                    {
                      id: `entry-${Date.now()}-${prev.length}`,
                      category: DEFAULT_CATEGORY,
                      minutes: remaining,
                      comment: '',
                    },
                  ]);
                }}
                className="ml-auto flex items-center gap-1 rounded-full px-3 py-1 text-sm text-lime-400 hover:text-lime-300 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!timerCapturedMinutes || timerCapturedMinutes <= 0}
              >
                <span>Add category</span>
                <CirclePlus className="h-4 w-4" />
              </button>
            </div>

            <h2 className="mb-4 text-center text-xl font-bold uppercase tracking-wide text-white">
              Log Details
            </h2>

            {/* {timerCapturedMinutes && timerCapturedMinutes > 0 && (
              <div className="mb-4 rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-3 text-center text-sm text-lime-200">
                From timer:{' '}
                <span className="font-semibold text-white">
                  {timerCapturedMinutes} minutes
                </span>
              </div>
            )} */}

            <div className="flex-1 overflow-y-auto flex flex-col gap-6">
              {timerEntries.map((entry, idx) => {
                const total = timerCapturedMinutes ?? 0;
                const prevSum = timerEntries.slice(0, idx).reduce((sum, e) => sum + e.minutes, 0);
                const maxForEntry = Math.max(0, total - prevSum);

                return (
                  <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setTimerEntries((prev) => prev.filter((e) => e.id !== entry.id));
                        }}
                        className="p-1 rounded-full text-red-400 hover:text-red-300 transition"
                        aria-label="Delete session"
                      >
                        <CircleMinus className="h-6 w-6" />
                      </button>
                    </div>

                    <div
                      ref={(el) => {
                        categoryScrollRefs.current[entry.id] = el;
                      }}
                      className="
                        flex items-center gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap
                        [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden
                        snap-x snap-mandatory
                      "
                    >
                      <div className="shrink-0 w-[35vw]" aria-hidden />
                      {CATEGORY_OPTIONS.map((cat) => {
                        const selectedIndex = CATEGORY_OPTIONS.indexOf(entry.category);
                        const catIndex = CATEGORY_OPTIONS.indexOf(cat);
                        const dist = Math.abs(catIndex - selectedIndex);
                        const isSelected = dist === 0;
                        const isAdjacent = dist === 1;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setTimerEntries((prev) =>
                                prev.map((e) =>
                                  e.id === entry.id ? { ...e, category: cat } : e
                                )
                              );
                            }}
                            ref={(el) => {
                              if (!categoryButtonRefs.current[entry.id]) {
                                categoryButtonRefs.current[entry.id] = {};
                              }
                              categoryButtonRefs.current[entry.id][cat] = el;
                            }}
                            className={`
                              rounded-full px-3 py-2 transition snap-center
                              ${
                                isSelected
                                  ? 'text-white text-3xl font-bold'
                                  : isAdjacent
                                  ? 'text-white/70 text-base font-semibold'
                                  : 'text-white/40 hover:text-white hover:bg-white/5 text-xs'
                              }
                            `}
                            style={{
                              transition: 'all 150ms ease',
                            }}
                          >
                            {cat}
                          </button>
                        );
                      })}
                      <div className="shrink-0 w-[35vw]" aria-hidden />
                    </div>

                    <div className="mt-4 text-center">
                      <p className="text-5xl font-black text-lime-400 leading-none mt-1">
                        {entry.minutes}m
                      </p>
                      <div className="mt-4">
                        <input
                          type="range"
                          min={0}
                          max={maxForEntry}
                          step={1}
                          value={Math.min(entry.minutes, maxForEntry)}
                          onChange={(e) => {
                            const nextVal = Number(e.target.value);
                            setTimerEntries((prev) => {
                              const totalMinutes = timerCapturedMinutes ?? 0;
                              const updated = [...prev];
                              const currentIndex = updated.findIndex((e) => e.id === entry.id);
                              if (currentIndex === -1) return prev;

                              const prevSum = updated
                                .slice(0, currentIndex)
                                .reduce((sum, e) => sum + e.minutes, 0);
                              const maxFor = Math.max(0, totalMinutes - prevSum);
                              const clamped = Math.max(0, Math.min(nextVal, maxFor));
                              updated[currentIndex] = { ...updated[currentIndex], minutes: clamped };

                              // redistribute the remainder to following entry, zero out the rest
                              let sumBefore = updated
                                .slice(0, currentIndex + 1)
                                .reduce((sum, e) => sum + e.minutes, 0);
                              let remaining = Math.max(0, totalMinutes - sumBefore);
                                for (let j = currentIndex + 1; j < updated.length; j++) {
                                  if (j === currentIndex + 1) {
                                    updated[j] = { ...updated[j], minutes: remaining };
                                    remaining = 0;
                                  } else {
                                    updated[j] = { ...updated[j], minutes: 0 };
                                  }
                                }
                              return updated;
                            });
                          }}
                          className="w-full accent-lime-400"
                          disabled={total <= 0}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-md font-medium text-white/80 mb-1">
                        Comments
                      </label>
                      <input
                        type="text"
                        value={entry.comment}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTimerEntries((prev) =>
                            prev.map((x) => (x.id === entry.id ? { ...x, comment: val } : x))
                          );
                        }}
                        className="
                          w-full rounded-lg px-3 py-3 text-base text-white
                          outline-none ring-1 ring-white/10 focus:ring-lime-400
                        "
                        placeholder="Add notes about this session"
                      />
                    </div>
                  </div>
                );
              })}

              <div className="mt-auto flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsTimerDetailsOpen(false);
                    setTimerCapturedMinutes(null);
                    closeTimerSheet();
                    setTimerEntries([]);
                    setIsTimerDetailsCollapsed(false);
                    setIsTimerDetailsFull(false);
                  }}
                  className="
                    flex-1 rounded-full px-4 py-2
                    border border-white/20 text-white
                    hover:bg-white/10 transition
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (!user || loggingSplits) return;
                    const totalMinutes = timerCapturedMinutes ?? 0;
                    if (totalMinutes <= 0) return;
                    const entriesToLog = timerEntries.filter((e) => e.minutes > 0);
                    if (!entriesToLog.length) return;

                    try {
                      setLoggingSplits(true);
                      await Promise.all(
                        entriesToLog.map((entry) =>
                          supabase.from('training_logs').insert({
                            user_id: user.id,
                            minutes: entry.minutes,
                            category: entry.category,
                            comment: entry.comment || null,
                          })
                        )
                      );
                      setIsTimerDetailsOpen(false);
                      setTimerCapturedMinutes(null);
                      setTimerEntries([]);
                      setIsTimerDetailsCollapsed(false);
                      setIsTimerDetailsFull(false);
                    } finally {
                      setLoggingSplits(false);
                    }
                  }}
                  disabled={
                    loggingSplits ||
                    !timerCapturedMinutes ||
                    timerCapturedMinutes <= 0 ||
                    !timerEntries.some((e) => e.minutes > 0)
                  }
                  className={`
                    flex-1 rounded-full px-4 py-2
                    ${
                      loggingSplits ||
                      !timerCapturedMinutes ||
                      timerCapturedMinutes <= 0 ||
                      !timerEntries.some((e) => e.minutes > 0)
                        ? 'bg-lime-400/30 text-lime-200/60 cursor-not-allowed'
                        : 'bg-lime-400 text-black hover:bg-lime-300'
                    }
                    font-semibold
                    transition
                  `}
                >
                  {loggingSplits ? 'Logging…' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isTimerDetailsCollapsed && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg p-3 grid grid-cols-3 items-center">
            <div className="flex justify-start">
              <button
                type="button"
                className="p-2 text-red-400 hover:text-red-200 transition"
                onClick={() => {
                  setIsTimerDetailsCollapsed(false);
                  setIsTimerDetailsOpen(false);
                  setTimerCapturedMinutes(null);
                  setTimerEntries([]);
                  setIsTimerDetailsFull(false);
                }}
                aria-label="Discard sessions"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div
              className="text-center text-base font-semibold text-lime-400"
              onClick={() => {
                setIsTimerDetailsOpen(true);
                setIsTimerDetailsCollapsed(false);
                setIsTimerDetailsFull(false);
              }}
            >
              {timerEntries.length} {timerEntries.length === 1 ? 'session' : 'sessions'}
            </div>

            <div
              className="flex justify-end text-right text-xl font-black text-white"
              onClick={() => {
                setIsTimerDetailsOpen(true);
                setIsTimerDetailsCollapsed(false);
                setIsTimerDetailsFull(false);
              }}
            >
              {timerEntries.reduce((sum, e) => sum + e.minutes, 0)}m
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
