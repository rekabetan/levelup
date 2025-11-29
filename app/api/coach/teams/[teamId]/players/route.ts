// app/api/coach/teams/[teamId]/players/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  _req: Request,
  { params }: { params: { teamId?: string } | Promise<{ teamId?: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const teamId = resolvedParams.teamId;

    if (!teamId) {
      return NextResponse.json(
        { error: 'Missing teamId' },
        { status: 400 }
      );
    }

    // Grab team first (for name + age + org)
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, name, age_group, org_id')
      .eq('id', teamId)
      .single();

    if (teamError) {
      console.error('[coach/team/players] team error', teamError);
      return NextResponse.json(
        { error: teamError.message || 'Could not load team' },
        { status: 500 }
      );
    }

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    let orgName: string | null = null;
    if (team.org_id) {
      const { data: org, error: orgError } = await supabaseAdmin
        .from('organizations')
        .select('name')
        .eq('id', team.org_id)
        .single();

      if (orgError) {
        console.error('[coach/team/players] org error', orgError);
      } else {
        orgName = org?.name ?? null;
      }
    }

    const { data: players, error: playersError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, handle, role')
      .eq('team_id', teamId)
      .eq('role', 'player')
      .order('username');

    if (playersError) {
      console.error('[coach/team/players] players error', playersError);
      return NextResponse.json(
        { error: playersError.message || 'Could not load players' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        age_group: team.age_group ?? null,
        org_name: orgName,
      },
      players: players ?? [],
    });
  } catch (err: any) {
    console.error('[coach/team/players] unexpected error', err);
    return NextResponse.json(
      { error: err?.message || 'Unexpected server error' },
      { status: 500 }
    );
  }
}
