/**
 * Typed fetchers for the Maintenance API.
 * Backend: `backend/app/routers/_combined.py::maintenance_router`.
 */

import { apiFetch } from "./api";
import { authHeader } from "./auth-client";

export type MaintenanceUrgency = "low" | "medium" | "high" | "emergency";
export type MaintenanceStatus =
  | "open"
  | "in_progress"
  | "scheduled"
  | "resolved"
  | "closed";

export interface MaintenanceRequest {
  id: string;
  property_id: string | null;
  tenant_id: string;
  category: string | null;
  description: string;
  urgency: MaintenanceUrgency | string;
  status: MaintenanceStatus | string;
  photos: string[];
  assigned_to: string | null;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

export async function listMaintenance(): Promise<MaintenanceRequest[]> {
  return apiFetch<MaintenanceRequest[]>(`/api/maintenance`, {
    headers: authHeader(),
    cache: "no-store",
  });
}

export async function updateMaintenance(
  id: string,
  patch: Partial<{
    status: MaintenanceStatus;
    assigned_to: string;
    resolution_notes: string;
  }>,
): Promise<MaintenanceRequest> {
  return apiFetch<MaintenanceRequest>(`/api/maintenance/${id}`, {
    method: "PATCH",
    headers: authHeader(),
    body: JSON.stringify(patch),
  });
}

export async function submitMaintenance(input: {
  property_id?: string | null;
  category?: string | null;
  description: string;
  urgency?: MaintenanceUrgency;
  photos?: string[];
}): Promise<MaintenanceRequest> {
  return apiFetch<MaintenanceRequest>(`/api/maintenance`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({ urgency: "medium", photos: [], ...input }),
  });
}
