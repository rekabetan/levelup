// components/ui/FloatingActionButton.tsx
'use client';

import { type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils'; // optional if you use cn

type FloatingActionButtonProps = {
  onClick: () => void;
  className?: string;
  positionClassName?: string;
  icon?: ReactNode;
  ariaLabel?: string;
};

export default function FloatingActionButton({
  onClick,
  className,
  positionClassName = 'bottom-6 right-6',
  icon,
  ariaLabel = 'Action',
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'fixed z-40 flex h-14 w-14 items-center justify-center rounded-full',
        'bg-lime-500 text-slate-950 shadow-lg shadow-lime-500/30',
        'transition hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-300',
        positionClassName,
        className
      )}
    >
      {icon ?? <Plus className="h-6 w-6" />}
    </button>
  );
}
