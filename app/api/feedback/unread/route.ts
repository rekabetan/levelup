// app/api/feedback/unread/route.ts
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

    const { count, error } = await supabaseAdmin
      .from('player_feedback')
      .select('id', { count: 'exact', head: true })
      .eq('player_id', playerId)
      .eq('is_read', false)
      .or('status.is.null,status.eq.submitted');

    if (error) {
      console.error('[feedback/unread] error', error);
      return NextResponse.json(
        { error: error.message || 'Could not load unread count' },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch (err: any) {
    console.error('[feedback/unread] unexpected', err);
    return NextResponse.json(
      { error: err?.message || 'Unexpected server error' },
      { status: 500 }
    );
  }
}
