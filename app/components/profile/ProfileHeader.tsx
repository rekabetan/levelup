// app/components/profile/ProfileHeader.tsx
'use client';

import type { User } from '@/lib/types';
import {
  AdminProfileAvatar,
  CoachProfileAvatar,
  PlayerProfileAvatar,
} from '@/app/components/profile/ProfileAvatar';

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
  subtitle?: string | null;
};

export default function ProfileHeader({
  user,
  weeklyStreak,
  orgNameOverride,
  teamNameOverride,
  teamAgeOverride,
  subtitle = null,
}: ProfileHeaderProps) {
  const isAdmin = user.role === 'admin';
  const isCoach = user.role === 'coach';
  const formatDisplayName = () => {
    const first = user.first_name?.trim();
    const lastInitial = user.last_name?.trim()?.charAt(0)?.toUpperCase();
    if (first) {
      return lastInitial ? `${first} ${lastInitial}` : first;
    }
    return user.username || 'Player';
  };

  return (
    <section className="flex flex-col items-start text-left relative">
      <div className="relative mb-4 flex items-end gap-4">
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

      <div className="flex flex-col items-start space-y-1 mb-2">
        <p className="mt-4 text-4xl font-semibold">
          {formatDisplayName()}{' '}
          {user.handle && (
            <span className="text-xl text-white/60 font-medium">
              (@{user.handle})
            </span>
          )}
        </p>
        {subtitle && (
          <p className="text-sm italic text-white/60">{subtitle}</p>
        )}

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
