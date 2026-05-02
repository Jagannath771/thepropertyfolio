/**
 * Deterministic property fixtures used by Playwright network stubs.
 * These objects match the shape of `backend/app/routers/properties.py::_property_to_dict`.
 */

export const FIXTURE_PROPERTIES = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    owner_id: "22222222-2222-2222-2222-222222222222",
    title: "Fixture Downtown Penthouse",
    description: "Fixture description for a penthouse.",
    address: "400 Fixture St",
    city: "San Francisco",
    state: "CA",
    zip_code: "94103",
    latitude: 37.7749,
    longitude: -122.4194,
    property_type: "apartment",
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1850,
    monthly_rent: 4200,
    deposit: 6300,
    available_date: "2026-06-01",
    status: "available",
    amenities: ["Pool", "Gym", "Parking"],
    pet_policy: "cats_only",
    images: [],
    is_featured: true,
    view_count: 0,
    created_at: "2026-05-01T12:00:00Z",
    updated_at: "2026-05-01T12:00:00Z",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    owner_id: "22222222-2222-2222-2222-222222222222",
    title: "Fixture Hillside House",
    description: "Fixture description for a house.",
    address: "1820 Fixture Blvd",
    city: "Los Angeles",
    state: "CA",
    zip_code: "90028",
    latitude: 34.0522,
    longitude: -118.2437,
    property_type: "house",
    bedrooms: 4,
    bathrooms: 3,
    square_feet: 2600,
    monthly_rent: 7500,
    deposit: 11250,
    available_date: "2026-05-15",
    status: "available",
    amenities: ["Pool", "Garden", "Parking"],
    pet_policy: "any",
    images: [],
    is_featured: true,
    view_count: 0,
    created_at: "2026-05-02T12:00:00Z",
    updated_at: "2026-05-02T12:00:00Z",
  },
];

export const FIXTURE_LIST_RESPONSE = {
  items: FIXTURE_PROPERTIES,
  total: FIXTURE_PROPERTIES.length,
  page: 1,
  page_size: 24,
  total_pages: 1,
};

export const FIXTURE_EMPTY_RESPONSE = {
  items: [],
  total: 0,
  page: 1,
  page_size: 24,
  total_pages: 0,
};
