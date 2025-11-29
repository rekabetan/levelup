// app/api/coach/teams/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

    // Load the coach profile to figure out their team
    const { data: coach, error: coachError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, team_id')
      .eq('id', coachId)
      .single();

    if (coachError) {
      console.error('[coach/teams] error loading coach', coachError);
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

    // If the coach is not linked to a team yet, return an empty list
    if (!coach.team_id) {
      return NextResponse.json({ teams: [] });
    }

    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, name, age_group, org_id')
      .eq('id', coach.team_id)
      .single();

    if (teamError) {
      console.error('[coach/teams] error loading team', teamError);
      return NextResponse.json(
        { error: teamError.message || 'Could not load team' },
        { status: 500 }
      );
    }

    if (!team) {
      return NextResponse.json({ teams: [] });
    }

    // Count players on the team (best-effort)
    const { count: playerCount, error: playerCountError } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', team.id)
      .eq('role', 'player');

    if (playerCountError) {
      console.error('[coach/teams] error counting players', playerCountError);
    }

    let orgName: string | null = null;

    if (team?.org_id) {
      const { data: org, error: orgError } = await supabaseAdmin
        .from('organizations')
        .select('name')
        .eq('id', team.org_id)
        .single();

      if (orgError) {
        console.error('[coach/teams] error loading org', orgError);
      } else {
        orgName = org?.name ?? null;
      }
    }

    const responseTeam = {
      id: team.id,
      name: team.name,
      age_group: team.age_group ?? null,
      org_name: orgName,
      player_count: typeof playerCount === 'number' ? playerCount : null,
    };

    return NextResponse.json({ teams: [responseTeam] });
  } catch (err: any) {
    console.error('[coach/teams] unexpected error', err);
    return NextResponse.json(
      { error: err?.message || 'Unexpected server error' },
      { status: 500 }
    );
  }
}
