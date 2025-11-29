// app/components/home/PlayerHome.tsx
'use client';

import type { User } from '@/lib/types';
import Dashboard from '@/app/components/dashboard/Dashboard';

type PlayerHomeProps = {
  user: User;
  onLogout: () => void;
};

export default function PlayerHome({ user, onLogout }: PlayerHomeProps) {
  return <Dashboard user={user} onLogout={onLogout} />;
}
