// app/api/profile/handle/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  const { userId, handle } = await req.json();

  if (
    !userId ||
    !handle ||
    typeof handle !== 'string' ||
    handle.trim().length < 3
  ) {
    return NextResponse.json(
      { error: 'Handle must be at least 3 characters.' },
      { status: 400 }
    );
  }

  // Normalize: strip leading @, lowercase
  const raw = handle.trim();
  const normalized = raw.startsWith('@') ? raw.slice(1) : raw;
  const clean = normalized.toLowerCase();

  // Make sure it's unique
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('handle', clean)
    .maybeSingle();

  if (existingError) {
    console.error(existingError);
    return NextResponse.json(
      { error: 'Error checking handle. Try again.' },
      { status: 500 }
    );
  }

  if (existing && existing.id !== userId) {
    return NextResponse.json(
      { error: 'That handle is already taken.' },
      { status: 409 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ handle: clean })
    .eq('id', userId)
    .select('id, username, handle')
    .single();

  if (error || !data) {
    console.error(error);
    return NextResponse.json(
      { error: 'Could not save handle. Try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id: data.id,
    username: data.username,
    handle: data.handle,
  });
}
