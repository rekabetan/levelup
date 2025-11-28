import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, role')
    .eq('role', 'player')
    .order('username');


  if (error) {
    console.error('[users] error:', error);
    return NextResponse.json(
      { users: [], error: 'Failed to load users' },
      { status: 500 }
    );
  }

  return NextResponse.json({ users: data ?? [] });
}
