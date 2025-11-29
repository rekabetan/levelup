// app/components/home/AdminHome.tsx
'use client';

import Link from 'next/link';
import type { User } from '@/lib/types';

type AdminHomeProps = {
  user: User;
  onLogout: () => void;
};

export default function AdminHome({ user, onLogout }: AdminHomeProps) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Admin Home</h2>
          <p className="text-xs text-white/60">
            Signed in as <span className="font-medium">{user.username}</span>
          </p>
        </div>

        <button
          onClick={onLogout}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-white/20 text-white/80 hover:text-white hover:bg-white/10 transition"
        >
          Sign out
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <p className="text-sm text-white/80">
          You have admin access. Use the link below to open the full admin
          dashboard.
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-lg border border-white/20 text-white/80 hover:text-white hover:bg-white/10 transition"
        >
          Open Admin Dashboard
        </Link>
      </div>
    </div>
  );
}
