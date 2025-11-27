import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, handle, avatar_url, weekly_goal') // 👈 include weekly_goal
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('[profile] error fetching user:', error);
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ user: data }, { status: 200 });
}
