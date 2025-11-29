// app/components/coach/TeamsSection.tsx (or wherever you keep it)
'use client';

import Link from 'next/link';
import Section from '@/components/ui/Section';

type CoachTeam = {
  id: string;
  name: string;
  age_group?: string | null;   // e.g. "10U"
  season_label?: string | null; // e.g. "Fall 2025"
  player_count?: number | null;
};

type TeamsSectionProps = {
  teams: CoachTeam[];
};

export default function TeamsSection({ teams }: TeamsSectionProps) {
  return (
    <Section title="Teams" className="mt-8">
      {!teams.length ? (
        <p className="text-sm text-slate-400">
          You’re not assigned to any teams yet.
        </p>
      ) : (
        <div className="space-y-2">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/coach/teams/${team.id}`}
              className="block rounded-xl px-3 py-2 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-100">
                    {team.name}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    {team.age_group && (
                      <span className="inline-flex items-center rounded-full bg-slate-900/80 px-2 py-0.5 text-[11px] uppercase tracking-wide">
                        {team.age_group}
                      </span>
                    )}
                    {team.season_label && (
                      <span className="inline-flex items-center rounded-full bg-slate-900/80 px-2 py-0.5 text-[11px]">
                        {team.season_label}
                      </span>
                    )}
                    {typeof team.player_count === 'number' && (
                      <span className="text-[11px] text-slate-500">
                        {team.player_count} players
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-[11px] font-medium text-slate-400">
                  View players &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Section>
  );
}
