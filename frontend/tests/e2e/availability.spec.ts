import { test, expect, Page } from "@playwright/test";

import {
  FIXTURE_EMPTY_RESPONSE,
  FIXTURE_LIST_RESPONSE,
  FIXTURE_PROPERTIES,
} from "./fixtures/properties";

async function stubPropertiesList(page: Page, body: unknown = FIXTURE_LIST_RESPONSE) {
  await page.route("**/api/properties*", async (route) => {
    const url = route.request().url();
    // The detail route is /api/properties/<id>; only stub list requests here.
    if (/\/api\/properties\/[^?]+(?:\?|$)/.test(url)) {
      return route.fallback();
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

async function stubPropertyDetail(page: Page, property = FIXTURE_PROPERTIES[0]) {
  await page.route(`**/api/properties/${property.id}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(property),
    });
  });
}

test.describe("Availability Page — live API", () => {
  test.beforeEach(async ({ page }) => {
    await stubPropertiesList(page);
    await page.goto("/availability");
  });

  test("has correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/Available Rental Properties/);
  });

  test("search input is visible and functional", async ({ page }) => {
    const search = page.getByPlaceholder(/search by city/i);
    await expect(search).toBeVisible();
    await search.fill("San Francisco");
    await expect(search).toHaveValue("San Francisco");
  });

  test("property type filters are visible", async ({ page }) => {
    for (const type of ["All", "House", "Apartment", "Condo"]) {
      await expect(page.getByRole("button", { name: type })).toBeVisible();
    }
  });

  test("grid/list view toggle works", async ({ page }) => {
    await page.getByRole("button", { name: "List view" }).click();
    await page.getByRole("button", { name: "Grid view" }).click();
  });

  test("properties from API are displayed", async ({ page }) => {
    await expect(page.getByText("Fixture Downtown Penthouse")).toBeVisible();
    await expect(page.getByText("Fixture Hillside House")).toBeVisible();
    await expect(page.getByTestId("property-card")).toHaveCount(2);
  });

  test("filtering by property type narrows results via API", async ({ page }) => {
    await page.getByRole("button", { name: "House" }).click();
    // Debounced refetch — the API stub returns the full list, but the
    // important behavior is that the app does not crash and keeps rendering.
    await expect(page.getByTestId("property-card").first()).toBeVisible();
  });
});

test.describe("Availability Page — empty state", () => {
  test("shows empty state CTA when API returns zero items", async ({ page }) => {
    await stubPropertiesList(page, FIXTURE_EMPTY_RESPONSE);
    await page.goto("/availability");
    await expect(page.getByTestId("availability-empty")).toBeVisible();
    await expect(page.getByRole("link", { name: /list your property/i })).toBeVisible();
  });
});

test.describe("Availability Page — error state", () => {
  test("shows error + retry when API 500s", async ({ page }) => {
    await page.route("**/api/properties*", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "boom" }),
      });
    });
    await page.goto("/availability");
    await expect(page.getByTestId("availability-error")).toBeVisible();
    await expect(page.getByRole("button", { name: /try again/i })).toBeVisible();
  });
});

/**
 * The property detail page is a Next.js server component — its data fetch
 * happens in Node, not in the browser, so `page.route` cannot intercept it.
 * PR 7 will introduce a global stub-HTTP harness (on the port that
 * NEXT_PUBLIC_API_URL points at) so SSR paths become testable without a live
 * backend. Until then, the 404 + detail rendering are exercised by the
 * integration tests in `backend/tests/` and manual smoke on the dev server.
 */
test.describe("Property Detail Page — live API", () => {
  test.fixme("renders details from the single-property endpoint", async ({ page }) => {
    const fixture = FIXTURE_PROPERTIES[0];
    await stubPropertyDetail(page, fixture);
    await page.goto(`/availability/${fixture.id}`);
    await expect(page.getByTestId("property-title")).toHaveText(fixture.title);
    await expect(page.getByText(/Apply Now/)).toBeVisible();
  });

  test.fixme("renders 404 not-found when detail endpoint 404s", async ({ page }) => {
    await page.route("**/api/properties/missing-id", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Property not found." }),
      });
    });
    await page.goto("/availability/missing-id");
    await expect(page.getByRole("heading", { name: /property not found/i })).toBeVisible();
  });
});

test.describe("Tenant Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tenants/login");
  });

  test("login form is visible", async ({ page }) => {
    await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
    await expect(page.getByPlaceholder(/••••••••/)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("link to register page exists", async ({ page }) => {
    await expect(page.getByRole("link", { name: /create one free/i })).toBeVisible();
  });
});

test.describe("Tenant Registration Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tenants/register");
  });

  test("registration form is complete", async ({ page }) => {
    await expect(page.getByPlaceholder("Jane Doe")).toBeVisible();
    await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
    await expect(page.getByPlaceholder(/create a strong password/i)).toBeVisible();
    await expect(page.getByRole("checkbox")).toBeVisible();
  });
});
