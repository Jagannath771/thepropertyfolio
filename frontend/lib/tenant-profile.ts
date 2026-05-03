/**
 * Tenant profile — `GET /api/tenants/me`.
 */

import { apiFetch } from "./api";
import { authHeader } from "./auth-client";

export interface TenantProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  is_verified: boolean;
  created_at: string;
}

export async function getTenantProfile(): Promise<TenantProfile> {
  return apiFetch<TenantProfile>(`/api/tenants/me`, {
    headers: authHeader(),
    cache: "no-store",
  });
}
