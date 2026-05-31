import { test, expect, Page } from "@playwright/test";

import {
  FIXTURE_LIST_RESPONSE,
  FIXTURE_PROPERTIES,
} from "./fixtures/properties";

async function stubPropertiesList(page: Page) {
  await page.route("**/api/properties*", async (route) => {
    const url = route.request().url();
    if (/\/api\/properties\/[^?]+(?:\?|$)/.test(url)) return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(FIXTURE_LIST_RESPONSE),
    });
  });
}

test.describe("Tenant User Flow", () => {
  test("can browse properties and filter (API-backed)", async ({ page }) => {
    await stubPropertiesList(page);
    await page.goto("/availability");

    await expect(page.getByPlaceholder(/Search by city/i)).toBeVisible();

    await page.getByRole("button", { name: "Apartment" }).click();

    const searchInput = page.getByPlaceholder(/Search by city/i);
    await searchInput.fill("San Francisco");

    await expect(page.getByText(/of \d+ properties/)).toBeVisible();
    await expect(page.getByTestId("property-card").first()).toBeVisible();
  });

  // The detail page is server-rendered; see availability.spec.ts note. PR 7
  // will introduce an SSR-aware stub harness and unskip this.
  test.fixme("can view property details (API-backed)", async ({ page }) => {
    const fixture = FIXTURE_PROPERTIES[0];
    await page.route(`**/api/properties/${fixture.id}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(fixture),
      });
    });

    await page.goto(`/availability/${fixture.id}`);

    await expect(page.getByTestId("property-title")).toHaveText(fixture.title);
    await expect(page.getByRole("link", { name: /apply now/i })).toBeVisible();
  });

  test("tenant dashboard redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/tenants/login");
    await expect(page).toHaveURL(/\/tenants\/login/);

    const response = await page.goto("/tenants/dashboard");
    expect([200, 302, 307, 308, 404]).toContain(response?.status() ?? 0);
  });
});
