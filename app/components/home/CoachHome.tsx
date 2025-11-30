// app/components/home/CoachHome.tsx
'use client';

import { useEffect, useState } from "react";
import type { User } from "@/lib/types";
import TodayCard, { type TodayEntry } from "@/app/components/coach/TodayCard";
import TeamsSection from "@/app/components/coach/TeamsSection";

type CoachHomeProps = {
  user: User;
  onLogout: () => void;
};

type CoachTeam = {
  id: string;
  name: string;
  age_group?: string | null;    // e.g. "10U"
  season_label?: string | null; // e.g. "Fall 2025"
  player_count?: number | null;
};

export default function CoachHome({ user, onLogout }: CoachHomeProps) {
  const [todayEntries, setTodayEntries] = useState<TodayEntry[]>([]);
  const [loadingToday, setLoadingToday] = useState(true);

  const [teams, setTeams] = useState<CoachTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  // ---- Load today's logs for this coach ----
  useEffect(() => {
    async function loadToday() {
      setLoadingToday(true);
      try {
        const res = await fetch(`/api/coach/today?coachId=${user.id}`);
        if (!res.ok) {
          console.error("Failed to fetch today logs", await res.text());
          setTodayEntries([]);
          return;
        }

        const data = await res.json();
        console.log("today logs raw:", data.logs?.[0]);

        const now = new Date();
        const startOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const startOfTomorrow = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1
        );

        const mapped: TodayEntry[] = (data.logs || [])
          .filter((log: any) => {
            const createdAt = new Date(log.created_at);
            return createdAt >= startOfToday && createdAt < startOfTomorrow;
          })
          .map((log: any) => {
            const playerName = log.player?.username ?? "Unknown";
            const createdAt = new Date(log.created_at);
            const dateLabel = createdAt.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
            const timeLabel = createdAt.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            });

            return {
              playerName,
              category: log.category ?? null,
              minutes: log.minutes ?? 0,
              timeLabel: `${dateLabel} ${timeLabel}`,
              note: log.comment ?? null,
            };
          });

        setTodayEntries(mapped);
      } catch (err) {
        console.error("Error loading today logs", err);
        setTodayEntries([]);
      } finally {
        setLoadingToday(false);
      }
    }

    loadToday();
  }, [user.id]);

  // ---- Load teams for this coach ----
  useEffect(() => {
    async function loadTeams() {
      setLoadingTeams(true);
      try {
        // 👉 Adjust this endpoint to match your real API / schema
        // e.g. /api/coach/teams or /api/teams?coachId=...
        const res = await fetch(`/api/coach/teams?coachId=${user.id}`);
        if (!res.ok) {
          console.error("Failed to fetch teams", await res.text());
          setTeams([]);
          return;
        }

        const data = await res.json();
        // Expecting something like { teams: [...] }
        const mapped: CoachTeam[] = (data.teams || []).map((t: any) => ({
          id: t.id,
          name: t.name,
          age_group: t.age_group ?? null,
          season_label: t.season_label ?? null,
          player_count: t.player_count ?? null,
        }));

        setTeams(mapped);
      } catch (err) {
        console.error("Error loading teams", err);
        setTeams([]);
      } finally {
        setLoadingTeams(false);
      }
    }

    loadTeams();
  }, [user.id]);

  return (
    <div className="w-full flex flex-col justify-start max-w-xl mx-auto px-2 space-y-4">
      {/* TeamsSection at the very top */}
      {!loadingTeams && <TeamsSection teams={teams} />}

      {/* TodayCard below teams */}
      <TodayCard entries={todayEntries} loading={loadingToday} />

      {/* Later: other coach-only cards go here */}
    </div>
  );
}
