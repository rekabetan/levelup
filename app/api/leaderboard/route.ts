// app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Period } from '@/lib/types';

// Helper: compute date range for "week" / "month" / "all"
function getDateRange(period: Period) {
  const now = new Date();

  if (period === 'week') {
    // Start of current week (Sunday) to match streak/recents views
    const day = now.getDay(); // 0 (Sun) - 6 (Sat)
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - day
    );
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { from: start, to: end };
  }

  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { from: start, to: end };
  }

  // 'all' – no date filter
  return { from: null, to: null };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = (searchParams.get('period') as Period) || 'week';

  // Later: you'll pass teamId from the client and filter by it
  const teamId = searchParams.get('teamId'); // currently unused if you don't have teams yet

  const { from, to } = getDateRange(period);

  // 1) Fetch all users (for now, all profiles; later: filter by teamId)
  let profilesQuery = supabaseAdmin
    .from('profiles')
    .select('id, username, first_name, last_name')
    .order('username', { ascending: true });

  // If/when you add a team_id column to profiles, you can do:
  if (teamId) {
    profilesQuery = profilesQuery.eq('team_id', teamId);
  }

  const { data: users, error: usersError } = await profilesQuery;

  if (usersError) {
    console.error('Error loading users for leaderboard:', usersError);
    return NextResponse.json(
      { error: 'Failed to load users', entries: [] },
      { status: 500 }
    );
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ entries: [] });
  }

  // 2) Fetch logs for those users in the given period
  let logsQuery = supabaseAdmin
    .from('training_logs')
    .select('user_id, minutes, created_at');

  // If logs have team_id directly, you could filter here instead of via users
  if (teamId) {
    logsQuery = logsQuery.eq('team_id', teamId);
  }

  if (from && to) {
    logsQuery = logsQuery
      .gte('created_at', from.toISOString())
      .lt('created_at', to.toISOString());
  }

  const { data: logs, error: logsError } = await logsQuery;

  if (logsError) {
    console.error('Error loading logs for leaderboard:', logsError);
    return NextResponse.json(
      { error: 'Failed to load logs', entries: [] },
      { status: 500 }
    );
  }

  // 3) Aggregate minutes by user_id
  const totalsByUser = new Map<string, number>();

  (logs || []).forEach((log) => {
    const current = totalsByUser.get(log.user_id) ?? 0;
    totalsByUser.set(log.user_id, current + (log.minutes ?? 0));
  });

  // 4) Build entries: one per user, 0 if no logs
  const entries = users
    .map((u) => ({
      id: u.id,
      username: u.username,
      first_name: (u as any).first_name ?? null,
      last_name: (u as any).last_name ?? null,
      total_minutes: totalsByUser.get(u.id) ?? 0,
    }))
    // 5) Sort by minutes desc, then name asc
    .sort((a, b) => {
      if (b.total_minutes !== a.total_minutes) {
        return b.total_minutes - a.total_minutes;
      }
      return a.username.localeCompare(b.username);
    });

  return NextResponse.json({ entries });
}
