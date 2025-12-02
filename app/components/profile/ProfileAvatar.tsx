// app/components/profile/ProfileAvatar.tsx
'use client';

import type { User } from '@/lib/types';

type AvatarSize = 'lg' | 'md' | 'sm';

type PlayerProfileAvatarProps = {
  user: User;
  weeklyStreak: number;
  size?: AvatarSize;
  showBadge?: boolean;
  className?: string;
};

type CoachProfileAvatarProps = {
  user: User;
  size?: AvatarSize;
  className?: string;
};

type AdminProfileAvatarProps = {
  user: User;
  size?: AvatarSize;
  className?: string;
};

const SIZE_CLASSES: Record<
  AvatarSize,
  {
    avatar: string;
    badgeWrapper: string;
    badgeStreak: string;
    badgeIcon: string;
  }
> = {
  lg: {
    avatar: 'h-24 w-24 text-4xl',
    badgeWrapper: '-bottom-4 h-8 px-2',
    badgeStreak: 'text-lg',
    badgeIcon: 'w-[15px] h-[15px]',
  },
  md: {
    avatar: 'h-12 w-12 text-xl',
    badgeWrapper: '-bottom-3 h-6 px-2',
    badgeStreak: 'text-sm',
    badgeIcon: 'w-3.5 h-3.5',
  },
  sm: {
    avatar: 'h-8 w-8 text-sm',
    badgeWrapper: '-bottom-2 h-5 px-1.5',
    badgeStreak: 'text-xs',
    badgeIcon: 'w-3 h-3',
  },
};

function getInitial(user: User) {
  return (
    (user.first_name && user.first_name.trim()[0]?.toUpperCase()) ||
    (user.username && user.username.trim()[0]?.toUpperCase()) ||
    (user.handle && user.handle.replace('@', '')[0]?.toUpperCase()) ||
    '?'
  );
}

export function PlayerProfileAvatar({
  user,
  weeklyStreak,
  size = 'lg',
  showBadge = true,
  className = '',
}: PlayerProfileAvatarProps) {
  const sizeClasses = SIZE_CLASSES[size];
  const isOnActiveStreak = weeklyStreak > 0;
  const ringClass = isOnActiveStreak
    ? 'ring-2 ring-lime-400 ring-offset-2 ring-offset-black'
    : 'ring-2 ring-zinc-700 ring-offset-2 ring-offset-black';

  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        className={`
          flex items-center justify-center rounded-full
          border border-white/10 bg-zinc-900 font-semibold
          ${sizeClasses.avatar}
          ${ringClass}
        `}
      >
        {getInitial(user)}
      </div>

      {showBadge && (
        <div
          className={`
            absolute left-1/2 -translate-x-1/2
            bg-lime-400 text-black font-bold
            flex items-center gap-1 shadow-lg rounded-sm
            [transform:skew(-12deg)]
            ${sizeClasses.badgeWrapper}
          `}
        >
          <div className="[transform:skew(12deg)] flex items-center gap-1">
            <svg
              viewBox="0 0 24 22"
              fill="currentColor"
              aria-hidden="true"
              className={sizeClasses.badgeIcon}
            >
              <path d="M9 20V10H4L12 1L20 10H15V20H9Z" />
            </svg>
            <span className={sizeClasses.badgeStreak}>{weeklyStreak}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function CoachProfileAvatar({
  user,
  size = 'lg',
  className = '',
}: CoachProfileAvatarProps) {
  const sizeClasses = SIZE_CLASSES[size];

  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        className={`
          flex items-center justify-center rounded-full
          border border-white/10 bg-zinc-900 font-semibold
          ${sizeClasses.avatar}
          ring-2 ring-sky-400 ring-offset-2 ring-offset-black
        `}
      >
        {getInitial(user)}
      </div>
    </div>
  );
}

export function AdminProfileAvatar({
  user,
  size = 'lg',
  className = '',
}: AdminProfileAvatarProps) {
  const sizeClasses = SIZE_CLASSES[size];

  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        className={`
          flex items-center justify-center rounded-full
          border border-amber-300/40 bg-zinc-900 font-semibold
          ${sizeClasses.avatar}
          ring-2 ring-[rgb(155,44,255)] ring-offset-2 ring-offset-black shadow-[0_0_18px_-4px_rgba(155,44,255,0.55),0_0_36px_-12px_rgba(155,44,255,0.4)]
        `}
      >
        {getInitial(user)}
      </div>
    </div>
  );
}

export default PlayerProfileAvatar;
