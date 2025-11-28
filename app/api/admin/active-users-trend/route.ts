// app/api/admin/active-users-trend/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type TrainingLogRow = {
  user_id: string;
  created_at: string;
};

function dateKey(d: Date): string {
  // YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const now = new Date();

    // Build the 7-day window (today and previous 6 days)
    const days: { key: string; label: string }[] = [];
    const perDayUsers = new Map<string, Set<string>>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const key = dateKey(d);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;

      days.push({ key, label });
      perDayUsers.set(key, new Set());
    }

    // Oldest day start
    const oldest = new Date(now);
    oldest.setDate(oldest.getDate() - 6);
    oldest.setHours(0, 0, 0, 0);

    // Pull all training_logs in the last 7 days
    const { data, error } = await supabaseAdmin
      .from('training_logs')
      .select('user_id, created_at')
      .gte('created_at', oldest.toISOString());

    if (error) {
      console.error('[ADMIN] active-users-trend error:', error);
      return NextResponse.json(
        { error: 'Failed to load active users trend' },
        { status: 500 }
      );
    }

    (data ?? []).forEach((row: TrainingLogRow) => {
      const d = new Date(row.created_at);
      const key = dateKey(d);
      const set = perDayUsers.get(key);
      if (set) {
        set.add(row.user_id);
      }
    });

    const points = days.map(({ key, label }) => {
      const count = perDayUsers.get(key)?.size ?? 0;
      return { day: key, label, value: count };
    });

    return NextResponse.json({ points });
  } catch (err) {
    console.error('[ADMIN] active-users-trend fatal error:', err);
    return NextResponse.json(
      { error: 'Failed to load active users trend' },
      { status: 500 }
    );
  }
}
