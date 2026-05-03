/**
 * Typed fetchers for the Applications API.
 * Backend: `backend/app/routers/applications.py`
 */

import { apiFetch } from "./api";
import { authHeader } from "./auth-client";

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
