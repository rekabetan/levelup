// app/api/login/check/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { username } = await req.json();

    if (!username || !username.trim()) {
      return NextResponse.json(
        { error: 'Missing username' },
        { status: 400 }
      );
    }

    const trimmed = username.trim();

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', trimmed)
      .maybeSingle();

    if (error) {
      console.error('login/check error:', error);
      return NextResponse.json(
        { error: 'Server error' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Could not find that player.' },
        { status: 404 }
      );
    }

    // Username exists → ok to move to PIN step
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('login/check exception:', err);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
