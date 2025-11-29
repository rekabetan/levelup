// app/api/feedback/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { coachId, playerId, body } = await req.json();

    if (!coachId || !playerId || !body?.trim()) {
      return NextResponse.json(
        { error: 'coachId, playerId, and body are required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('player_feedback')
      .insert({
        coach_id: coachId,
        player_id: playerId,
        body,
      });

    if (error) {
      console.error('[feedback] insert error', error);
      return NextResponse.json(
        { error: error.message || 'Could not save feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[feedback] unexpected error', err);
    return NextResponse.json(
      { error: err?.message || 'Unexpected server error' },
      { status: 500 }
    );
  }
}
