// app/api/user/weekly-goal/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, weekly_goal } = body as {
      userId?: string;
      weekly_goal?: number;
    };

    if (!userId || typeof weekly_goal !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid userId/weekly_goal' },
        { status: 400 }
      );
    }

    // 👇 Change 'users' to 'profiles' if your table is named differently
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ weekly_goal })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[weekly-goal] Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: data }, { status: 200 });
  } catch (err) {
    console.error('[weekly-goal] Unknown error:', err);
    return NextResponse.json(
      { error: 'Unexpected error' },
      { status: 500 }
    );
  }
}
