/**
 * Typed fetchers for the Applications API.
 * Backend: `backend/app/routers/applications.py`
 */

import { API_BASE_URL, apiFetch } from "./api";
import { authHeader, getAccessToken } from "./auth-client";

export type ApplicationStatus =
  | "pending"
  | "under_review"
  | "background_check"
  | "approved"
  | "denied"
  | "withdrawn";

export interface Application {
  id: string;
  property_id: string | null;
  tenant_id: string;
  status: ApplicationStatus | string;
  personal_info: Record<string, unknown> | null;
  employment_info: Record<string, unknown> | null;
  rental_history: unknown[] | null;
  references: unknown[] | null;
  document_urls: string[];
  background_check_consent: boolean;
  owner_notes: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export async function listApplications(): Promise<Application[]> {
  return apiFetch<Application[]>(`/api/applications`, {
    headers: authHeader(),
    cache: "no-store",
  });
}

/**
 * Absolute URL for `EventSource` (cannot send Authorization header).
 * Returns null if the user is not signed in on this device.
 */
export function getApplicationsStreamUrl(): string | null {
  const token = getAccessToken();
  if (!token) return null;
  const u = new URL(`${API_BASE_URL}/api/applications/stream`);
  u.searchParams.set("access_token", token);
  return u.toString();
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  owner_notes?: string,
): Promise<Application> {
  return apiFetch<Application>(`/api/applications/${id}`, {
    method: "PATCH",
    headers: authHeader(),
    body: JSON.stringify({ status, owner_notes }),
  });
}
