// app/api/feedback/drafts/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const coachId = searchParams.get('coachId');
    const playerIdsParam = searchParams.get('playerIds');

    if (!coachId) {
      return NextResponse.json(
        { error: 'Missing coachId' },
        { status: 400 }
      );
    }

    const query = supabaseAdmin
      .from('player_feedback')
      .select('id, player_id, body, status, created_at')
      .eq('coach_id', coachId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false });

    if (playerIdsParam) {
      const ids = playerIdsParam
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      if (ids.length > 0) {
        query.in('player_id', ids);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('[feedback/drafts] error', error);
      return NextResponse.json(
        { error: error.message || 'Could not load drafts' },
        { status: 500 }
      );
    }

    return NextResponse.json({ drafts: data ?? [] });
  } catch (err: any) {
    console.error('[feedback/drafts] unexpected error', err);
    return NextResponse.json(
      { error: err?.message || 'Unexpected server error' },
      { status: 500 }
    );
  }
}
