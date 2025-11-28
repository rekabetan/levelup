import type { User } from '@/lib/types';

export function isAdmin(user: User | null | undefined) {
  return user?.role === 'admin';
}

export function isCoach(user: User | null | undefined) {
  return user?.role === 'coach' || user?.role === 'admin';
}
