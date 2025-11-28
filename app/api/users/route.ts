// app/api/users/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    // 1) Load player profiles with their team_id
    const {
      data: profileRows,
      error: profilesError,
    } = await supabaseAdmin
      .from('profiles')
      .select('id, username, role, handle, weekly_goal, team_id')
      .eq('role', 'player')
      .order('username');

    if (profilesError) {
      throw profilesError;
    }

    const profiles = profileRows ?? [];

    if (profiles.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // 2) Collect unique team IDs
    const teamIds = Array.from(
      new Set(
        profiles
          .map((p: any) => p.team_id)
          .filter((id: string | null) => Boolean(id))
      )
    );

    let teamRows: any[] = [];
    let orgRows: any[] = [];

    // 3) Load teams
    if (teamIds.length > 0) {
      const {
        data: tData,
        error: teamsError,
      } = await supabaseAdmin
        .from('teams')
        .select('id, name, org_id, age_group') // 👈 org_id here
        .in('id', teamIds);

      if (teamsError) {
        throw teamsError;
      }

      teamRows = tData ?? [];

      // 4) Collect unique org_ids from teams
      const orgIds = Array.from(
        new Set(
          teamRows
            .map((t: any) => t.org_id) // 👈 org_id here
            .filter((id: string | null) => Boolean(id))
        )
      );

      // 5) Load organizations
      if (orgIds.length > 0) {
        const {
          data: oData,
          error: orgsError,
        } = await supabaseAdmin
          .from('organizations')
          .select('id, name')
          .in('id', orgIds);

        if (orgsError) {
          throw orgsError;
        }

        orgRows = oData ?? [];
      }
    }

    // 6) Build lookup maps
    const teamMap = new Map(teamRows.map((t) => [t.id, t]));
    const orgMap = new Map(orgRows.map((o) => [o.id, o]));

    // 7) Map profiles → front-end User shape
    const users = profiles.map((p: any) => {
      const team = p.team_id ? teamMap.get(p.team_id) : null;
      const org =
        team && team.org_id
          ? orgMap.get(team.org_id)
          : null;

      return {
        id: p.id,
        username: p.username,
        role: p.role,
        handle: p.handle ?? null,
        weekly_goal: p.weekly_goal ?? null,
        team_name: team?.name ?? null,
        organization_name: org?.name ?? null,
        team_age_group: team?.age_group ?? null, // 👈 new
      };
    });


    return NextResponse.json({ users });
  } catch (err: any) {
    console.error('[api/users] error:', err);
    return NextResponse.json(
      { users: [], error: err?.message ?? 'Failed to load users' },
      { status: 500 }
    );
  }
}
