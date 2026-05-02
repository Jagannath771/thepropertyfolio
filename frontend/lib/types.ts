/**
 * Typed data contracts mirroring the FastAPI backend responses.
 * Keep in sync with `backend/app/routers/properties.py::_property_to_dict`.
 */

export type PropertyStatus = "available" | "coming_soon" | "leased" | "archived";

export interface Property {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  latitude: number | null;
  longitude: number | null;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  monthly_rent: number | null;
  deposit: number | null;
  available_date: string | null;
  status: PropertyStatus | string;
  amenities: string[];
  pet_policy: string | null;
  images: string[];
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface PropertyListResponse {
  items: Property[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PropertyListParams {
  page?: number;
  page_size?: number;
  property_type?: string;
  city?: string;
  min_rent?: number;
  max_rent?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  status?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  featured_only?: boolean;
  search?: string;
}
