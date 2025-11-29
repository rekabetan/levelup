// app/api/coach/today/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const LOGS_TABLE = 'training_logs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const coachId = searchParams.get('coachId');

    if (!coachId) {
      return NextResponse.json(
        { error: 'Missing coachId' },
        { status: 400 }
      );
    }

    // 1) Load coach to get team_id
    const { data: coach, error: coachError } = await supabaseAdmin
      .from('profiles')
      .select('id, team_id, role')
      .eq('id', coachId)
      .single();

    if (coachError) {
      console.error('Error loading coach profile', coachError);
      return NextResponse.json(
        { error: coachError.message || 'Could not load coach profile' },
        { status: 500 }
      );
    }

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }

    if (!coach.team_id) {
      // No team assigned yet
      return NextResponse.json({ logs: [] });
    }

    // 2) Load all players on this team
    const { data: players, error: playersError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, team_id, role')
      .eq('team_id', coach.team_id);
      // Optionally: .eq('role', 'player');

    if (playersError) {
      console.error('Error loading team players', playersError);
      return NextResponse.json(
        { error: playersError.message || 'Could not load team players' },
        { status: 500 }
      );
    }

    if (!players || players.length === 0) {
      return NextResponse.json({ logs: [] });
    }

    const playerIds = players.map((p) => p.id);
    const playersById = new Map(
      players.map((p) => [p.id, { id: p.id, username: p.username }])
    );

    // 3) Fetch recent logs for those players (no date filter)
    const { data: logs, error: logsError } = await supabaseAdmin
      .from(LOGS_TABLE)
      .select('id, user_id, minutes, category, comment, created_at')
      .in('user_id', playerIds)
      .order('created_at', { ascending: false })
      .limit(200);

    if (logsError) {
      console.error('Error loading team logs', logsError);
      return NextResponse.json(
        { error: logsError.message || 'Could not get team logs.' },
        { status: 500 }
      );
    }

    const logsWithPlayers =
      (logs ?? []).map((log) => ({
        ...log,
        player: playersById.get(log.user_id) || null,
      }));

    return NextResponse.json({ logs: logsWithPlayers });
  } catch (err: any) {
    console.error('Unexpected error in /api/coach/today', err);
    return NextResponse.json(
      { error: err?.message || 'Unexpected server error' },
      { status: 500 }
    );
  }
}
