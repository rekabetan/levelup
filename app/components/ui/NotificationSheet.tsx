// app/components/ui/NotificationSheet.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCheck, ChevronRight } from 'lucide-react';

export type NotificationItem = {
  id: string;
  title: string;
  body?: string | null;
  created_at: string;
  is_read?: boolean;
  kind?: 'feedback' | 'system';
  coach_first_name?: string | null;
  coach_last_name?: string | null;
  coach_role?: string | null;
  coach_username?: string | null;
};

type NotificationSheetProps = {
  open: boolean;
  notifications: NotificationItem[];
  loading?: boolean;
  onClose: () => void;
  onSelect?: (id: string) => void;
  onMarkAllRead?: () => void;
};

export default function NotificationSheet({
  open,
  notifications,
  loading,
  onClose,
  onSelect,
  onMarkAllRead,
}: NotificationSheetProps) {
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Lock background scroll while open
  useEffect(() => {
    if (!open) return;
    const prevBody = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody;
    };
  }, [open]);

  if (!open) return null;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const formatCoachLabel = (n: NotificationItem) => {
    const roleBase = n.coach_role ? n.coach_role.toLowerCase() : 'coach';
    const roleLabel =
      roleBase === 'admin'
        ? 'Coach'
        : roleBase.charAt(0).toUpperCase() + roleBase.slice(1);

    const rawFirst = n.coach_first_name?.trim();
    const cleanedFirst = rawFirst
      ? rawFirst.replace(/^coach\s+/i, '').trim()
      : '';
    const usernameFirst =
      n.coach_username?.trim()?.split(/\s+/)[0] || null;
    const coachFirst = cleanedFirst || usernameFirst;

    const coachLastInitial = n.coach_last_name
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase();

    if (coachFirst) {
      return coachLastInitial
        ? `${roleLabel} ${coachFirst} ${coachLastInitial}`
        : `${roleLabel} ${coachFirst}`;
    }

    return roleLabel;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const scrollEl = scrollRef.current;
    if (scrollEl && scrollEl.scrollTop > 2) {
      setDragStartY(null);
      return;
    }
    setDragStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY === null || e.touches.length !== 1) return;
    const delta = e.touches[0].clientY - dragStartY;
    setDragOffset(Math.max(0, delta));
  };

  const handleTouchEnd = () => {
    const shouldClose = dragOffset > 100;
    if (shouldClose) onClose();
    setDragOffset(0);
    setDragStartY(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close notifications"
        onClick={onClose}
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-white/30" />

        <h2 className="text-center text-xl font-bold uppercase tracking-wide text-white">
          Notifications
        </h2>
        <p className="mt-1 text-center text-white/50 text-xs mb-4">
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </p>

        {onMarkAllRead && unreadCount > 0 && (
          <div className="mb-3 flex justify-center">
            <button
              type="button"
              onClick={onMarkAllRead}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          </div>
        )}

        <div
          ref={scrollRef}
          className="
            flex-1 overflow-y-auto min-h-0 divide-y divide-white/10
            border-b border-white/10
          "
        >
          {loading ? (
            <p className="text-sm text-white/70 py-4 text-center">Loading…</p>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center text-white/60 text-sm">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => {
              const dateLabel = new Date(n.created_at).toLocaleDateString(
                undefined,
                { month: 'short', day: 'numeric' }
              );

              const coachLabel = formatCoachLabel(n);

              const displayTitle =
                n.kind === 'feedback'
                  ? `${coachLabel} sent you feedback`
                  : n.title || 'Notification';

              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onSelect?.(n.id)}
                  className="
                    w-full flex items-start gap-3 text-left px-2 py-3
                    hover:bg-white/5 transition
                  "
                >
                  {!n.is_read && (
                    <span className="mt-[6px] h-2.5 w-2.5 rounded-full bg-lime-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-white truncate">
                          {displayTitle}
                        </p>
                        {n.body && (
                          <p className="text-xs text-white/60">
                            {n.body.length > 30 ? `${n.body.slice(0, 30)}…` : n.body}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 self-center">
                        <span className="text-[12px] text-white/60 flex-shrink-0">
                          {dateLabel}
                        </span>
                        <ChevronRight className="h-5 w-5 text-white/50" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={onClose}
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
  );
}
