// app/lib/authClient.ts

export function signoutClient(options?: { redirectTo?: string }) {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem('levelup_user');

  if (options?.redirectTo) {
    window.location.href = options.redirectTo;
  }
}
