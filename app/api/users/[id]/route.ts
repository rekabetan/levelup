// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Adjust column list to what you actually need
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, handle, role, weekly_goal')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[GET /api/users/[id]] error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ user: data }, { status: 200 });
}
