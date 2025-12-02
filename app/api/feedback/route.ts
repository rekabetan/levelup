// app/api/feedback/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const {
      coachId,
      playerId,
      body,
      status = 'submitted',
      feedbackId,
    } = await req.json();

    if (!coachId || !playerId || !body?.trim()) {
      return NextResponse.json(
        { error: 'coachId, playerId, and body are required' },
        { status: 400 }
      );
    }

    if (!['draft', 'submitted'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be draft or submitted.' },
        { status: 400 }
      );
    }

    const payload: {
      coach_id: string;
      player_id: string;
      body: string;
      status: 'draft' | 'submitted';
      is_read?: boolean;
    } = {
      coach_id: coachId,
      player_id: playerId,
      body,
      status,
    };

    // When submitting, ensure the message starts unread for the player
    if (status === 'submitted') {
      payload.is_read = false;
    }

    if (feedbackId) {
      const { data, error } = await supabaseAdmin
        .from('player_feedback')
        .update(payload)
        .eq('id', feedbackId)
        .eq('coach_id', coachId)
        .select('id')
        .single();

      if (error) {
        console.error('[feedback] update error', error);
        return NextResponse.json(
          { error: error.message || 'Could not save feedback' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, id: data?.id, status });
    }

    const { data, error } = await supabaseAdmin
      .from('player_feedback')
      .insert({
        ...payload,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[feedback] insert error', error);
      return NextResponse.json(
        { error: error.message || 'Could not save feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data?.id, status });
  } catch (err: any) {
    console.error('[feedback] unexpected error', err);
    return NextResponse.json(
      { error: err?.message || 'Unexpected server error' },
      { status: 500 }
    );
  }
}
