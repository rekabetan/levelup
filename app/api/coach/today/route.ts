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

    /* 1) Load coach profile to get team_id */
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
      // Coach not assigned to a team yet
      return NextResponse.json({ logs: [] });
    }

    /* 2) Load all players on this coach's team */
    const { data: players, error: playersError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, team_id, role')
      .eq('team_id', coach.team_id);
      // If you want to restrict to players only, you can chain:
      // .eq('role', 'player');

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
    const playerIdSet = new Set(playerIds);

    /* 3) Compute start/end of "today" in UTC */
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );

    /* 4) Fetch all logs for today from training_logs */
    const { data: logs, error: logsError } = await supabaseAdmin
      .from(LOGS_TABLE)
      .select('id, user_id, minutes, category, comment, created_at')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('Error loading team logs', logsError);
      return NextResponse.json(
        { error: logsError.message || 'Could not get team logs.' },
        { status: 500 }
      );
    }

    const playersById = new Map(
      players.map((p) => [p.id, { id: p.id, username: p.username }])
    );

    // 5) Filter logs to just this coach's team and attach player info
    const teamLogs =
      (logs ?? [])
        .filter((log) => playerIdSet.has(log.user_id))
        .map((log) => ({
          ...log,
          player: playersById.get(log.user_id) || null,
        }));

    return NextResponse.json({ logs: teamLogs });
  } catch (err: any) {
    console.error('Unexpected error in /api/coach/today', err);
    return NextResponse.json(
      { error: err?.message || 'Unexpected server error' },
      { status: 500 }
    );
  }
}
