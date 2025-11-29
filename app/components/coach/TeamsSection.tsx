// app/components/coach/TeamsSection.tsx (or wherever you keep it)
'use client';

import Link from 'next/link';
import Section from '@/components/ui/Section';
import { ChevronRight } from 'lucide-react';

type CoachTeam = {
  id: string;
  name: string;
  age_group?: string | null;   // e.g. "10U"
  season_label?: string | null; // e.g. "Fall 2025"
  player_count?: number | null;
  org_name?: string | null;
};

type TeamsSectionProps = {
  teams: CoachTeam[];
  title?: string;
};

export default function TeamsSection({ teams, title }: TeamsSectionProps) {
  return (
    <Section title={title || 'Teams'} className="mt-8">
      {!teams.length ? (
        <p className="text-sm text-slate-400">
          You’re not assigned to any teams yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {teams.map((team) => {
            const ageLabel = team.age_group
              ? `${team.age_group}${String(team.age_group)
                  .toUpperCase()
                  .endsWith('U') ? '' : 'U'}`
              : null;

            return (
              <li key={team.id}>
                <Link
                  href={`/coach/teams/${team.id}`}
                  className="block border-b border-white/5 pb-4 last:border-b-0 last:pb-0 transition hover:translate-y-[1px]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-base font-semibold text-white">
                      {team.name}
                      {ageLabel ? ` ${ageLabel}` : ''}
                    </span>
                    <ChevronRight className="h-5 w-5 text-white/50" />
                  </div>

                  {team.season_label && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="inline-flex items-center rounded-full bg-slate-900/80 px-2 py-0.5 text-[11px]">
                        {team.season_label}
                      </span>
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
