// components/dashboard/Dashboard.tsx
import type { User } from '@/lib/types';
import ChooseHandleCard from '@/components/auth/ChooseHandleCard';
import StreakCard from '@/components/dashboard/StreakCard';
import LogTimeCard from '@/components/dashboard/LogTimeCard';
import LeaderboardCard from '@/components/dashboard/LeaderboardCard';

type DashboardProps = {
  user: User;
  onLogout: () => void;
};

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const needsHandle = !user.handle;

  return (
    <div className="w-full max-w-xl mx-auto px-2 space-y-4">
      <div className="flex items-center justify-between bg-slate-900/70 px-4 py-3 rounded-2xl border border-slate-700">
        <div>
          <p className="text-lg text-slate-300 font-bold">
            Welcome, {user.username}!
          </p>
        </div>
        <button
          onClick={onLogout}
          className="text-xs border border-slate-500 rounded-full px-3 py-1 hover:bg-slate-800"
        >
          Sign out
        </button>
      </div>

      {needsHandle ? (
        <ChooseHandleCard user={user} />
      ) : (
        <>
          <StreakCard userId={user.id} />
          <LogTimeCard user={user} />
          <LeaderboardCard currentUser={user.username} />
        </>
      )}
    </div>
  );
}
