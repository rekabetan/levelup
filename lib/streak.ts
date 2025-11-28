// /lib/streak.ts

export type LogEntry = {
  id: string;
  minutes: number;
  category: string | null;
  comment: string | null;
  created_at: string;
};

// Helper: get start-of-week (Sunday 00:00) for a given date
export function getWeekStart(date: Date): number {
  const dayOfWeek = date.getDay(); // 0 = Sunday
  const start = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - dayOfWeek
  );
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

/**
 * Weekly streak:
 * - A "qualifying day" = total minutes that day >= 15
 * - A "qualifying week" = 4+ qualifying days in that week
 * - Weekly streak = number of consecutive qualifying weeks ending with this week
 */
export function computeWeeklyStreak(entries: LogEntry[]): number {
  if (!entries.length) return 0;

  // 1) total minutes per day
  const minutesPerDay = new Map<number, number>(); // dayMidnight -> total minutes

  for (const log of entries) {
    const d = new Date(log.created_at);
    const dayMidnight = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate()
    ).getTime();

    minutesPerDay.set(
      dayMidnight,
      (minutesPerDay.get(dayMidnight) || 0) + log.minutes
    );
  }

  // 2) count qualifying days per week (>= 15 min)
  const qualifyingDaysPerWeek = new Map<number, number>(); // weekStart -> count of qualifying days

  minutesPerDay.forEach((totalMinutes, dayMidnight) => {
    if (totalMinutes < 15) return; // not a qualifying day

    const dayDate = new Date(dayMidnight);
    const weekStart = getWeekStart(dayDate);

    qualifyingDaysPerWeek.set(
      weekStart,
      (qualifyingDaysPerWeek.get(weekStart) || 0) + 1
    );
  });

  // 3) mark which weeks are "qualifying weeks" (>= 4 qualifying days)
  const qualifyingWeeks = new Set<number>();

  qualifyingDaysPerWeek.forEach((days, weekStart) => {
    if (days >= 4) qualifyingWeeks.add(weekStart);
  });

  if (qualifyingWeeks.size === 0) return 0;

  // 4) compute streak from *current* week backwards
  const now = new Date();
  let currentWeekStart = getWeekStart(now);
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

  let streak = 0;
  while (qualifyingWeeks.has(currentWeekStart)) {
    streak += 1;
    currentWeekStart -= oneWeekMs; // previous week
  }

  return streak;
}

/**
 * For the avatar:
 * - Count how many days *this week* have >= 15 minutes
 * - Cap at 4
 */
export function getQualifyingDaysThisWeek(entries: LogEntry[]): number {
  if (!entries.length) return 0;

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - dayOfWeek
  ); // Sunday 00:00

  const totals = new Map<number, number>();

  for (const log of entries) {
    const d = new Date(log.created_at);
    if (d < startOfWeek || d > now) continue;

    const dayMidnight = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate()
    ).getTime();

    totals.set(dayMidnight, (totals.get(dayMidnight) || 0) + log.minutes);
  }

  let qualifyingDays = 0;
  totals.forEach(total => {
    if (total >= 15) qualifyingDays += 1;
  });

  return Math.min(4, qualifyingDays);
}