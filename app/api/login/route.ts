// app/api/login/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { username, pin } = await req.json();

    if (!username || !pin) {
      return NextResponse.json(
        { error: 'Missing username or PIN' },
        { status: 400 }
      );
    }

    const trimmedName = username.trim();
    const trimmedPin = pin.trim();

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, username, handle, pin, role, weekly_goal, avatar_url')
      .eq('username', trimmedName)
      .eq('pin', trimmedPin)
      .single();

    if (error || !data) {
      console.error('login error:', error);
      return NextResponse.json(
        { error: 'Invalid name or PIN' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: data.id,
      username: data.username,
      handle: data.handle,
      role: data.role ?? 'player',
      weekly_goal: data.weekly_goal,
      avatar_url: data.avatar_url,
    });
  } catch (err) {
    console.error('login exception:', err);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
