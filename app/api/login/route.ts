// app/api/login/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { username, pin } = await req.json();

    if (!username || !pin) {
      return NextResponse.json(
        { error: 'Missing username or PIN' },
        { status: 400 }
      );
    }

    const trimmedName = String(username).trim();
    const trimmedPin = String(pin).trim();

    if (!trimmedName || !trimmedPin) {
      return NextResponse.json(
        { error: 'Missing username or PIN' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, username, first_name, last_name, handle, pin, role, weekly_goal, avatar_url, team_id')
      .eq('username', trimmedName)
      .eq('pin', trimmedPin)
      .single();

    if (error || !data) {
      console.error('login error:', error);
      return NextResponse.json(
        { error: 'Invalid name or PIN' },
        { status: 401 }
      );
    }

    // Look up team + org details for richer profile data
    let teamName: string | null = null;
    let teamAgeGroup: number | null = null;
    let organizationName: string | null = null;

    if (data.team_id) {
      const { data: teamRow } = await supabaseAdmin
        .from('teams')
        .select('name, age_group, org_id')
        .eq('id', data.team_id)
        .single();

      if (teamRow) {
        teamName = teamRow.name ?? null;
        teamAgeGroup = teamRow.age_group ?? null;

        if (teamRow.org_id) {
          const { data: orgRow } = await supabaseAdmin
            .from('organizations')
            .select('name')
            .eq('id', teamRow.org_id)
            .single();

          organizationName = orgRow?.name ?? null;
        }
      }
    }

    return NextResponse.json({
      id: data.id,
      username: data.username,
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
      handle: data.handle,
      role: data.role ?? 'player',
      weekly_goal: data.weekly_goal ?? null,
      avatar_url: data.avatar_url ?? null,
      team_name: teamName,
      organization_name: organizationName,
      team_age_group: teamAgeGroup,
    });
  } catch (err) {
    console.error('login exception:', err);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
