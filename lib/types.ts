// lib/types.ts
export type User = {
  id: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  handle?: string | null;
  role?: string | null;
  avatar_url?: string | null;
weekly_goal?: number | null; // in minutes
  // New flat fields:
  team_name?: string | null;
  organization_name?: string | null;
  team_age_group?: number | null;
};


export type Entry = {
  username: string;
  total_minutes: number;
};

export type Period = 'week' | 'month' | 'all';

export type Category =
  | 'Baserunning'
  | 'Catching'
  | 'Hitting'
  | 'Infield'
  | 'Outfield'
  | 'Pitching'
  | 'Fitness'
  | 'Mindset';

export type LogEntry = {
  id: string;
  minutes: number;
  category: string | null;
  comment: string | null;
  created_at: string;
};
