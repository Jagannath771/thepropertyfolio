/**
 * Authenticated mutation + fetch helpers for the owner dashboard.
 *
 * All of these hit FastAPI endpoints that require `require_owner`, and
 * attach the current user's access token via `authHeader()`.
 */

import { apiFetch, API_BASE_URL } from "./api";
import { authHeader } from "./auth-client";
import type { Property } from "./types";

export interface CreatePropertyInput {
  title: string;
  description?: string | null;
  address: string;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  property_type?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  square_feet?: number | null;
  monthly_rent?: number | null;
  deposit?: number | null;
  /** YYYY-MM-DD */
  available_date?: string | null;
  amenities?: string[];
  pet_policy?: string | null;
  is_featured?: boolean;
}

export type UpdatePropertyInput = Partial<CreatePropertyInput & { status: string }>;

export interface OwnerPropertyListResponse {
  items: Property[];
  total: number;
}

export interface PresignedUpload {
  presigned_url: string;
  public_url: string;
}

export async function createProperty(input: CreatePropertyInput): Promise<Property> {
  return apiFetch<Property>(`/api/properties`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(input),
  });
}

export async function updateProperty(
  id: string,
  input: UpdatePropertyInput,
): Promise<Property> {
  return apiFetch<Property>(`/api/properties/${id}`, {
    method: "PUT",
    headers: authHeader(),
    body: JSON.stringify(input),
  });
}

export async function archiveProperty(id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/properties/${id}`, {
    method: "DELETE",
    headers: authHeader(),
  });
}

export async function listOwnerProperties(
  includeArchived = false,
): Promise<OwnerPropertyListResponse> {
  const qs = includeArchived ? "?include_archived=true" : "";
  return apiFetch<OwnerPropertyListResponse>(`/api/owners/properties${qs}`, {
    headers: authHeader(),
    cache: "no-store",
  });
}

export async function requestImageUpload(
  propertyId: string,
  filename: string,
  contentType: string,
): Promise<PresignedUpload> {
  return apiFetch<PresignedUpload>(`/api/properties/${propertyId}/images`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({ filename, content_type: contentType }),
  });
}

/**
 * Full upload dance: presign → PUT file bytes directly to S3/R2.
 * Returns the final public URL (also appended to `property.images` in the DB
 * by the backend before this promise resolves).
 */
export async function uploadPropertyImage(
  propertyId: string,
  file: File,
): Promise<string> {
  const { presigned_url, public_url } = await requestImageUpload(
    propertyId,
    file.name,
    file.type || "image/jpeg",
  );

  const res = await fetch(presigned_url, {
    method: "PUT",
    headers: { "Content-Type": file.type || "image/jpeg" },
    body: file,
  });
  if (!res.ok) {
    throw new Error(
      `Image upload to object storage failed (HTTP ${res.status}). Check CORS + bucket permissions.`,
    );
  }
  return public_url;
}

/** Exposed for tests / diagnostics. */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
