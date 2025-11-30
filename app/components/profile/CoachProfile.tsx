// app/components/profile/CoachProfile.tsx
'use client';

import { useEffect, useState } from 'react';
import type { LogEntry, User } from '@/lib/types';
import { computeWeeklyStreak } from '@/lib/streak';
import ProfileHeader from '@/app/components/profile/ProfileHeader';
import TeamsSection from '@/app/components/coach/TeamsSection';

type CoachProfileProps = {
  user: User;
  logs: LogEntry[];
};

type CoachTeam = {
  id: string;
  name: string;
  age_group?: string | null;
  season_label?: string | null;
  player_count?: number | null;
  org_name?: string | null;
};

export default function CoachProfile({ user, logs }: CoachProfileProps) {
  const weeklyStreak = computeWeeklyStreak(logs);
  const [teams, setTeams] = useState<CoachTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [profileOrgName, setProfileOrgName] = useState<string | null>(null);
  const [profileTeamName, setProfileTeamName] = useState<string | null>(null);
  const [profileTeamAge, setProfileTeamAge] = useState<string | number | null>(null);

  useEffect(() => {
    async function loadTeams() {
      if (!user?.id) return;
      setLoadingTeams(true);
      try {
        const res = await fetch(`/api/coach/teams?coachId=${user.id}`);
        if (!res.ok) {
          console.error('Failed to fetch teams for coach profile', await res.text());
          setTeams([]);
          return;
        }
        const data = await res.json();
        const loadedTeams = (data.teams || []) as CoachTeam[];
        setTeams(loadedTeams);

        const primaryTeam = loadedTeams[0];
        if (primaryTeam) {
          setProfileTeamName(primaryTeam.name ?? null);
          setProfileTeamAge(primaryTeam.age_group ?? null);
          setProfileOrgName(primaryTeam.org_name ?? null);
        }
      } catch (err) {
        console.error('Error loading teams for coach profile', err);
        setTeams([]);
        setProfileOrgName(null);
        setProfileTeamName(null);
        setProfileTeamAge(null);
      } finally {
        setLoadingTeams(false);
      }
    }

    loadTeams();
  }, [user?.id]);

  const title = teams.length === 1 ? 'Team' : 'Teams';

  return (
    <main className="flex-1 w-full px-6 py-6 max-w-lg mx-auto space-y-10">
      <ProfileHeader
        user={user}
        weeklyStreak={weeklyStreak}
        orgNameOverride={profileOrgName}
        teamNameOverride={profileTeamName}
        teamAgeOverride={profileTeamAge}
      />

      <TeamsSection teams={teams} title={title} />

      {loadingTeams && (
        <p className="text-sm text-white/60">Loading teams…</p>
      )}
    </main>
  );
}
