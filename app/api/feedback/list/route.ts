// app/api/feedback/list/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json(
        { error: 'Missing playerId' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('player_feedback')
      .select(
        [
          'id',
          'body',
          'created_at',
          'is_read',
          'coach_id',
          'status',
          'coach:coach_id (username, first_name, last_name, role)',
        ].join(', ')
      )
      .eq('player_id', playerId)
      .or('status.is.null,status.eq.submitted')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[feedback/list] error', error);
      return NextResponse.json(
        { error: error.message || 'Could not load feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ feedback: data ?? [] });
  } catch (err: any) {
    console.error('[feedback/list] unexpected', err);
    return NextResponse.json(
      { error: err?.message || 'Unexpected server error' },
      { status: 500 }
    );
  }
}
