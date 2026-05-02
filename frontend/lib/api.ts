/**
 * Shared HTTP client helpers for the FastAPI backend.
 *
 * Reads `NEXT_PUBLIC_API_URL` at build time (injected via next.config.mjs).
 * Works in both server components (via direct fetch) and client components.
 */

export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export interface FetchOptions extends RequestInit {
  /** Pass to Next.js fetch for ISR/SSR cache control. */
  next?: { revalidate?: number | false; tags?: string[] };
}

/**
 * Thin wrapper around fetch that:
 * - resolves relative paths against API_BASE_URL
 * - adds JSON headers when a body is provided
 * - parses JSON responses
 * - throws ApiError on non-2xx with parsed body when available
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const res = await fetch(url, { ...options, headers });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body: unknown = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const detail =
      isJson && typeof body === "object" && body && "detail" in body
        ? String((body as { detail: unknown }).detail)
        : res.statusText;
    throw new ApiError(res.status, detail, body);
  }

  return body as T;
}

/**
 * Build a query string from a plain object, skipping null/undefined/empty values.
 * Arrays become repeated keys (e.g. `amenities=Pool&amenities=Gym`).
 */
export function toQuery(
  params: Record<string, string | number | boolean | null | undefined | string[]>,
): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      for (const v of value) sp.append(key, String(v));
    } else {
      sp.append(key, String(value));
    }
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}
