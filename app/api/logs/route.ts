// app/api/logs/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const ALLOWED_CATEGORIES = [
  'Hitting',
  'Infield',
  'Outfield',
  'Pitching',
  'Baserunning',
  'Fitness',
  'Mental',
] as const;

// CREATE log
export async function POST(req: Request) {
  const { userId, minutes, category, comment } = await req.json();

  if (!userId || !minutes || typeof minutes !== 'number' || minutes <= 0) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  let cleanCategory: string | null = null;
  if (category) {
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    cleanCategory = category;
  }

  const cleanComment =
    typeof comment === 'string' && comment.trim().length > 0
      ? comment.trim()
      : null;

  const { data, error } = await supabaseAdmin
    .from('training_logs')
    .insert({
      user_id: userId,
      minutes,
      category: cleanCategory,
      comment: cleanComment,
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to log time' }, { status: 500 });
  }

  return NextResponse.json({ success: true, log: data });
}

// READ recent logs for a user
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('training_logs')
    .select('id, minutes, category, comment, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(25);

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to load logs' },
      { status: 500 },
    );
  }

  return NextResponse.json({ logs: data || [] });
}

// DELETE a log (by this user)
export async function DELETE(req: Request) {
  const { logId, userId } = await req.json();

  if (!logId || !userId) {
    return NextResponse.json({ error: 'Missing logId or userId' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('training_logs')
    .delete()
    .eq('id', logId)
    .eq('user_id', userId);

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to delete log' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
