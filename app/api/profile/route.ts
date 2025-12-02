// app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId')?.trim();

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, first_name, last_name, handle, role, weekly_goal, avatar_url, team_id')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    console.error('profile error or not found', { userId, error });
    // Return 200 to avoid noisy 404s in client logs; caller can handle null user
    return NextResponse.json({ user: null, error: 'User not found' });
  }

  return NextResponse.json({ user: data });
}
