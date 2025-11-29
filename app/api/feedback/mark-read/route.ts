// app/api/feedback/mark-read/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { feedbackId } = await req.json();

    if (!feedbackId) {
      return NextResponse.json(
        { error: 'Missing feedbackId' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('player_feedback')
      .update({ is_read: true })
      .eq('id', feedbackId);

    if (error) {
      console.error('[feedback/mark-read] error', error);
      return NextResponse.json(
        { error: error.message || 'Could not mark as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[feedback/mark-read] unexpected', err);
    return NextResponse.json(
      { error: err?.message || 'Unexpected server error' },
      { status: 500 }
    );
  }
}
