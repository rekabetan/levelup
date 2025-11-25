// app/api/login/check/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  const { username } = await req.json();

  if (
    !username ||
    typeof username !== 'string' ||
    username.trim().length < 2
  ) {
    return NextResponse.json(
      { error: 'Please enter a valid name.' },
      { status: 400 }
    );
  }

  const cleanName = username.trim();

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, is_verified')
    .eq('username', cleanName)
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Problem checking name. Try again.' },
      { status: 500 }
    );
  }

  if (!data || !data.is_verified) {
    return NextResponse.json(
      { error: 'That player is not found or not activated yet.' },
      { status: 404 }
    );
  }

  // We don't log them in yet, just confirm the player exists
  return NextResponse.json({
    id: data.id,
    username: data.username,
  });
}
