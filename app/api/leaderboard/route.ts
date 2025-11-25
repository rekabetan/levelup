// app/api/leaderboard/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'week'; // 'week' | 'month' | 'all'

  const table =
    period === 'month'
      ? 'leaderboard_month'
      : period === 'all'
      ? 'leaderboard_all_time'
      : 'leaderboard_week';

  const { data, error } = await supabaseAdmin
    .from(table)
    .select('*')
    .order('total_minutes', { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [] });
}
