/**
 * Client-side auth token helpers.
 *
 * Current storage mechanism matches the login pages:
 * - `access_token` stored in localStorage (primary source)
 * - `access_token` also set as a (non-HttpOnly) cookie so middleware can
 *   gate protected routes without a server round-trip.
 *
 * PR 5 will migrate to HttpOnly Secure cookies + a Next.js proxy; until
 * then this helper centralises read access so the migration is a one-file
 * change.
 */

export const ACCESS_TOKEN_KEY = "access_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  // Best-effort cookie clear (matches login-page cookie write format).
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0`;
}

export function authHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
