'use client';

import Link from 'next/link';

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
  if (!teams.length) {
    return (
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-200 tracking-tight">
          Teams
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          You’re not assigned to any teams yet.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200 tracking-tight">
          Teams
        </h2>
      </div>

      <div className="mt-3 space-y-2">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/coach/teams/${team.id}`}
            className="block rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 hover:border-slate-600 hover:bg-slate-900/60 transition-colors"
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
    </section>
  );
}
