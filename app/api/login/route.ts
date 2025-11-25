// app/api/login/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  const { username, pin } = await req.json();

  if (
    !username ||
    typeof username !== 'string' ||
    username.trim().length < 2 ||
    !pin ||
    typeof pin !== 'string' ||
    pin.trim().length < 3
  ) {
    return NextResponse.json(
      { error: 'Invalid username or PIN' },
      { status: 400 }
    );
  }

  const cleanName = username.trim();
  const cleanPin = pin.trim();

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, pin, is_verified, handle')
    .eq('username', cleanName)
    .eq('pin', cleanPin)
    .eq('is_verified', true)
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Problem checking user. Try again later.' },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Username or PIN is incorrect, or account not activated.' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    id: data.id,
    username: data.username, // Display Name
    handle: data.handle,     // might be null first login
  });
}
