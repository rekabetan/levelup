// lib/types.ts
export type User = {
  id: string;
  username: string;
  handle?: string | null;
  weekly_goal?: number | null; // in minutes
};

export type Entry = {
  username: string;
  total_minutes: number;
};

export type Period = 'week' | 'month' | 'all';

export type Category =
  | 'Hitting'
  | 'Infield'
  | 'Outfield'
  | 'Pitching'
  | 'Baserunning'
  | 'Fitness'
  | 'Mental';

export type LogEntry = {
  id: string;
  minutes: number;
  category: string | null;
  comment: string | null;
  created_at: string;
};
