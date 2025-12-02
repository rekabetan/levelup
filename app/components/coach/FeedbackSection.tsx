// app/components/coach/FeedbackSection.tsx
'use client';

import Section from '@/components/ui/Section';
import { List, ListItem } from '@/components/ui/List';

type FeedbackItem = {
  id: string;
  body: string;
  created_at: string;
  is_read: boolean;
  status?: 'draft' | 'submitted';
  coach?: {
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    role?: string | null;
  } | null;
};

type FeedbackSectionProps = {
  feedbackItems: FeedbackItem[];
  loading?: boolean;
  error?: string | null;
  onShowMore?: () => void;
  onSelect?: (id: string) => void;
};

export default function FeedbackSection({
  feedbackItems,
  loading,
  error,
  onShowMore,
  onSelect,
}: FeedbackSectionProps) {
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

  const currentYear = new Date().getFullYear();
  const filtered = feedbackItems.filter((f) => {
    if (f.status && f.status !== 'submitted') return false;
    const d = new Date(f.created_at);
    return d.getFullYear() === currentYear;
  });
  const preview = filtered.slice(0, 5);

  return (
    <Section
      title="Feedback"
      action={
        feedbackItems.length > 0 ? (
          <button
            type="button"
            onClick={onShowMore}
            className="text-sm font-semibold text-lime-400 hover:text-lime-300"
          >
            Show more →
          </button>
        ) : undefined
      }
    >
      {loading ? (
        <p className="text-base text-white/60">Loading feedback…</p>
      ) : error ? (
        <p className="text-base text-red-400">{error}</p>
      ) : preview.length === 0 ? (
        <p className="text-base text-white/60">No feedback yet this year.</p>
      ) : (
        <List>
          {preview.map((item) => {
            const dateLabel = new Date(item.created_at).toLocaleDateString(
              undefined,
              { month: 'short', day: 'numeric' }
            );

            return (
              <ListItem key={item.id} className="items-start">
                <button
                  type="button"
                  onClick={() => onSelect?.(item.id)}
                  className="w-full flex items-center gap-3 text-left py-2"
                >
                  {!item.is_read && (
                    <span className="h-2.5 w-2.5 rounded-full bg-lime-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        item.is_read ? 'text-white/70' : 'text-white font-semibold'
                      }`}
                    >
                      Feedback from {formatCoachLabel(item.coach)}
                    </p>
                  </div>
                  <span className="text-xs text-white/50 flex-shrink-0">
                    {dateLabel}
                  </span>
                </button>
              </ListItem>
            );
          })}

          {filtered.length > preview.length && (
            <ListItem className="border-0 pb-0">
              <button
                type="button"
                onClick={onShowMore}
                className="w-full text-sm font-semibold text-lime-400 hover:text-lime-300 text-left"
              >
                Show more →
              </button>
            </ListItem>
          )}
        </List>
      )}
    </Section>
  );
}
