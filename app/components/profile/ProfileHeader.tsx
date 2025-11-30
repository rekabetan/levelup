// app/components/profile/ProfileHeader.tsx
'use client';

import { Mail } from 'lucide-react';
import type { User } from '@/lib/types';
import ProfileAvatar from '@/app/components/profile/ProfileAvatar';

function formatAgeLabel(age?: string | number | null) {
  if (age === null || age === undefined) return null;
  const str = String(age);
  return str.toUpperCase().endsWith('U') ? str : `${str}U`;
}

type ProfileHeaderProps = {
  user: User;
  weeklyStreak: number;
  orgNameOverride?: string | null;
  teamNameOverride?: string | null;
  teamAgeOverride?: string | number | null;
  showMessageButton?: boolean;
  unreadCount?: number;
  onMessageClick?: () => void;
};

export default function ProfileHeader({
  user,
  weeklyStreak,
  orgNameOverride,
  teamNameOverride,
  teamAgeOverride,
  showMessageButton = false,
  unreadCount = 0,
  onMessageClick,
}: ProfileHeaderProps) {
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

            {(teamNameOverride ||
              teamAgeOverride != null ||
              user.team_name ||
              user.team_age_group != null) && (
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
