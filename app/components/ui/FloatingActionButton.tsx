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
  variant?: 'primary' | 'secondary';
};

export default function FloatingActionButton({
  onClick,
  className,
  positionClassName = 'bottom-6 right-6',
  icon,
  ariaLabel = 'Action',
  variant = 'primary',
}: FloatingActionButtonProps) {
  const variantClasses =
    variant === 'secondary'
      ? 'bg-white/5 text-white border border-white/10 shadow-lg shadow-black/40 backdrop-blur-xl hover:bg-white/10 focus:ring-2 focus:ring-white/30'
      : 'bg-lime-500 text-slate-950 shadow-lg shadow-lime-500/30 hover:bg-lime-400 focus:ring-2 focus:ring-lime-300';

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'fixed z-40 flex h-14 w-14 items-center justify-center rounded-full transition focus:outline-none',
        variantClasses,
        positionClassName,
        className
      )}
    >
      {icon ?? <Plus className="h-6 w-6" />}
    </button>
  );
}
