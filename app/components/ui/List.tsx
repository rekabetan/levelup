// app/components/ui/List.tsx
'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';

type ListProps = {
  children: ReactNode;
  className?: string;
};

type ListItemProps = {
  children: ReactNode;
  className?: string;
};

export function List({ children, className }: ListProps) {
  return <ul className={clsx('space-y-4', className)}>{children}</ul>;
}

export function ListItem({ children, className }: ListItemProps) {
  return (
    <li
      className={clsx(
        'flex items-center gap-3 border-b border-white/5 pb-4 last:border-b-0 last:pb-0',
        className
      )}
    >
      {children}
    </li>
  );
}
