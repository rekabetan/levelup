// app/components/home/CoachHome.tsx
'use client';

import { useEffect, useState } from "react";
import type { User } from "@/lib/types";
import TodayCard, { type TodayEntry } from "@/app/components/coach/TodayCard";

type CoachHomeProps = {
  user: User;
  onLogout: () => void;
};

export default function CoachHome({ user, onLogout }: CoachHomeProps) {
  const [todayEntries, setTodayEntries] = useState<TodayEntry[]>([]);
  const [loadingToday, setLoadingToday] = useState(true);

  useEffect(() => {
    async function loadToday() {
      setLoadingToday(true);
      try {
        // 👉 Adjust this URL to match your actual API
        // e.g. /api/coach/today or /api/logs?coachId=...
        const res = await fetch(`/api/coach/today?coachId=${user.id}`);
        if (!res.ok) {
          console.error("Failed to fetch today logs", await res.text());
          setTodayEntries([]);
          return;
        }

        const data = await res.json();
        console.log("today logs raw:", data.logs?.[0]);
        // 👉 Adjust this mapping to match your real response shape
        // Assuming data.logs is an array of logs with created_at, minutes, etc.
        const mapped: TodayEntry[] = (data.logs || []).map((log: any) => {
          const playerName = log.player?.username ?? "Unknown";

          return {
            playerName,
            category: log.category ?? null,
            minutes: log.minutes ?? 0,
            timeLabel: new Date(log.created_at).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            }),
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

  return (
    <div className="w-full flex flex-col justify-start max-w-xl mx-auto px-2 space-y-4">
      <TodayCard entries={todayEntries} loading={loadingToday} />

      {/* Later: other coach-only cards go here */}
    </div>
  );
}
