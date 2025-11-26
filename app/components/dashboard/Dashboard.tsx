// components/dashboard/Dashboard.tsx
'use client';

import type { User } from '@/lib/types';
import ChooseHandleCard from '@/components/auth/ChooseHandleCard';
import GoalCard from '@/components/goal/GoalCard';
import StreakCard from '@/components/dashboard/StreakCard';
import LeaderboardCard from '@/components/dashboard/LeaderboardCard';

type DashboardProps = {
  user: User;
  onLogout: () => void;
};

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const needsHandle = !user.handle;

  return (
    <div className="w-full max-w-xl mx-auto px-2 space-y-4">
      {needsHandle ? (
        <ChooseHandleCard user={user} />
      ) : (
        <>
          <StreakCard userId={user.id} />
          <GoalCard user={user} />
          <LeaderboardCard currentUser={user.username} />
        </>
      )}
    </div>
  );
}
