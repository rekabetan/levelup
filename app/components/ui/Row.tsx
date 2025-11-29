// app/components/ui/Row.tsx
'use client';

import type { ReactNode } from 'react';
import clsx from 'clsx';

type RowProps = {
  children: ReactNode;
  highlighted?: boolean; // e.g. "me" on leaderboard
  className?: string;
};

export default function Row({ children, highlighted, className }: RowProps) {
  return (
    <div
      className={clsx(
        `
        rounded-xl px-3 py-2
        border border-white/15
        text-white
        transition
      `,
        highlighted
          ? 'bg-white/5 backdrop-blur-xl border-white/10 shadow-md font-semibold'
          : 'hover:bg-white/5',
        className
      )}
    >
      {children}
    </div>
  );
}
