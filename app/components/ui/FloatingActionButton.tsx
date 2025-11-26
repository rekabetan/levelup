// components/ui/FloatingActionButton.tsx
'use client';

import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils'; // optional if you use cn

type FloatingActionButtonProps = {
  onClick: () => void;
  className?: string;
};

export default function FloatingActionButton({
  onClick,
  className,
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Log time"
      className={cn(
        'fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full',
        'bg-lime-500 text-slate-950 shadow-lg shadow-lime-500/30',
        'transition hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-300',
        className
      )}
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}
