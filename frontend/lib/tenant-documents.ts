/**
 * Tenant portal documents — `GET /api/tenants/documents`.
 */

import { apiFetch } from "./api";
import { authHeader } from "./auth-client";

export interface TenantDocumentItem {
  id: string;
  title: string;
  byte_size: number | null;
  created_at: string;
  download_url: string | null;
}

export async function listTenantDocuments(): Promise<{ items: TenantDocumentItem[] }> {
  return apiFetch<{ items: TenantDocumentItem[] }>(`/api/tenants/documents`, {
    headers: authHeader(),
    cache: "no-store",
  });
}
