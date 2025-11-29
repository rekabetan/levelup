// app/components/ui/Card.tsx
'use client';

import type { ReactNode } from 'react';
import clsx from 'clsx';

type CardProps = {
  title: string;
  subtitle?: string;
  rightAdornment?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export default function Card({
  title,
  subtitle,
  rightAdornment,
  children,
  footer,
  className,
}: CardProps) {
  return (
    <section
      className={clsx(
        `
        relative w-full min-w-[160px] min-h-[240px]
        bg-white/5
        backdrop-blur-xl
        border border-white/10
        rounded-2xl
        shadow-2xl shadow-black/70
        flex flex-col
        text-white
        p-4
      `,
        className
      )}
    >
      {/* Floating adornment (e.g. pill, icon) */}
      {rightAdornment && (
        <div className="absolute top-3 right-3">
          {rightAdornment}
        </div>
      )}

      {/* Title block – matches StreakCard */}
      <div className="w-full mb-3 text-center">
        <p className="text-xl font-bold uppercase tracking-wide w-full">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-white/60 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Body (same flex behavior as StreakCard middle section) */}
      <div className="flex-1 min-h-0">
        {children}
      </div>

      {/* Footer pinned to bottom, like your bottom bar on StreakCard */}
      {footer && (
        <div className="w-full mt-4 pt-2 border-t border-white/10">
          {footer}
        </div>
      )}
    </section>
  );
}
