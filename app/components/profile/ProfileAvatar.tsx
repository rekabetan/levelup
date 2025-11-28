// app/components/profile/ProfileAvatar.tsx
'use client';

import type { User } from '@/lib/types'; // adjust path/alias as you have it

type ProfileAvatarProps = {
  user: User;
  weeklyStreak: number;           // 🔥 required
  size?: 'lg' | 'md' | 'sm';
  showBadge?: boolean;
  className?: string;
};

export default function ProfileAvatar({
  user,
  weeklyStreak,
  size = 'lg',
  showBadge = true,
  className = '',
}: ProfileAvatarProps) {
  const initial =
    (user.username && user.username.trim()[0]?.toUpperCase()) ||
    (user.handle && user.handle.replace('@', '')[0]?.toUpperCase()) ||
    '?';

  const sizeClasses = {
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
  }[size];

  const isOnActiveStreak = weeklyStreak > 0;     // ← only thing that controls lime ring

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
        {initial}
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
