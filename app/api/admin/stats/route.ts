// app/api/admin/stats/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    /* ---------- TOTAL USERS ---------- */
    const { count: totalUsersCount, error: totalError } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    if (totalError) {
      console.error('[ADMIN] total users error:', totalError);
      throw new Error('Failed to fetch total users');
    }

    /* ---------- ACTIVE USERS & LOGS (training_logs) ---------- */

    // Daily: today
    const { data: dailyLogsRows, error: dailyLogsErr } = await supabaseAdmin
      .from('training_logs')
      .select('id, user_id')
      .gte('created_at', startOfToday.toISOString());

    if (dailyLogsErr) {
      console.error('[ADMIN] daily logs error:', dailyLogsErr);
    }

    const dailyLogs = dailyLogsErr ? 0 : (dailyLogsRows?.length ?? 0);
    const dailyActiveUsers = dailyLogsErr
      ? 0
      : new Set((dailyLogsRows ?? []).map((r) => r.user_id)).size;

    // Weekly: last 7 days
    const { data: weeklyLogsRows, error: weeklyLogsErr } = await supabaseAdmin
      .from('training_logs')
      .select('id, user_id')
      .gte('created_at', sevenDaysAgo.toISOString());

    if (weeklyLogsErr) {
      console.error('[ADMIN] weekly logs error:', weeklyLogsErr);
    }

    const weeklyLogs = weeklyLogsErr ? 0 : (weeklyLogsRows?.length ?? 0);
    const weeklyActiveUsers = weeklyLogsErr
      ? 0
      : new Set((weeklyLogsRows ?? []).map((r) => r.user_id)).size;

    // Monthly: last 30 days
    const { data: monthlyLogsRows, error: monthlyLogsErr } = await supabaseAdmin
      .from('training_logs')
      .select('id, user_id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (monthlyLogsErr) {
      console.error('[ADMIN] monthly logs error:', monthlyLogsErr);
    }

    const monthlyLogs = monthlyLogsErr ? 0 : (monthlyLogsRows?.length ?? 0);
    const monthlyActiveUsers = monthlyLogsErr
      ? 0
      : new Set((monthlyLogsRows ?? []).map((r) => r.user_id)).size;

    /* ---------- NEW USERS (profiles.first_login_at) ---------- */

    const { count: dailyNewUsersCount, error: dailyNewErr } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('first_login_at', startOfToday.toISOString());

    if (dailyNewErr) {
      console.error('[ADMIN] daily new users error:', dailyNewErr);
    }

    const { count: weeklyNewUsersCount, error: weeklyNewErr } =
      await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('first_login_at', sevenDaysAgo.toISOString());

    if (weeklyNewErr) {
      console.error('[ADMIN] weekly new users error:', weeklyNewErr);
    }

    const { count: monthlyNewUsersCount, error: monthlyNewErr } =
      await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('first_login_at', thirtyDaysAgo.toISOString());

    if (monthlyNewErr) {
      console.error('[ADMIN] monthly new users error:', monthlyNewErr);
    }

    /* ---------- RESPONSE ---------- */

    return NextResponse.json({
      totalUsers: totalUsersCount ?? 0,

      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,

      dailyNewUsers: dailyNewUsersCount ?? 0,
      weeklyNewUsers: weeklyNewUsersCount ?? 0,
      monthlyNewUsers: monthlyNewUsersCount ?? 0,

      dailyLogs,
      weeklyLogs,
      monthlyLogs,
    });
  } catch (err) {
    console.error('[ADMIN] stats fatal error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
