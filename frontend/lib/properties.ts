/**
 * Typed fetchers for the Properties API.
 * Backend: `backend/app/routers/properties.py`
 */

import { apiFetch, toQuery } from "./api";
import type {
  Property,
  PropertyListParams,
  PropertyListResponse,
} from "./types";

/**
 * List properties with filters. Defaults match the public catalog use-case:
 * only available listings, newest first, 12 per page.
 *
 * `revalidate` is forwarded to Next.js data cache when called from a server
 * component (no-op in the browser).
 */
export async function listProperties(
  params: PropertyListParams = {},
  revalidate: number | false = 30,
): Promise<PropertyListResponse> {
  const qs = toQuery({
    page: params.page ?? 1,
    page_size: params.page_size ?? 12,
    property_type: params.property_type ?? null,
    city: params.city ?? null,
    min_rent: params.min_rent ?? null,
    max_rent: params.max_rent ?? null,
    bedrooms: params.bedrooms ?? null,
    bathrooms: params.bathrooms ?? null,
    amenities: params.amenities ?? null,
    status: params.status ?? "available",
    sort_by: params.sort_by ?? "created_at",
    sort_order: params.sort_order ?? "desc",
    featured_only: params.featured_only ?? null,
    search: params.search ?? null,
  });

  return apiFetch<PropertyListResponse>(`/api/properties${qs}`, {
    next: { revalidate, tags: ["properties"] },
  });
}

/**
 * Fetch a single property by ID. Returns null on 404 so callers can
 * `notFound()` cleanly in server components.
 */
export async function getProperty(
  id: string,
  revalidate: number | false = 30,
): Promise<Property | null> {
  try {
    return await apiFetch<Property>(`/api/properties/${id}`, {
      next: { revalidate, tags: [`property:${id}`] },
    });
  } catch (err) {
    if (
      err instanceof Error &&
      "status" in err &&
      (err as { status: number }).status === 404
    ) {
      return null;
    }
    throw err;
  }
}
