import { test, expect, Page } from "@playwright/test";

import { FIXTURE_PROPERTIES } from "./fixtures/properties";

/**
 * Full owner "post-a-listing + upload images" E2E against the browser-side
 * network. The backend is stubbed at page.route so this spec does not require
 * a live API or S3. PR 7 will introduce an SSR-aware harness for the
 * cross-check against /availability/{id}.
 */

const NEW_PROPERTY = {
  ...FIXTURE_PROPERTIES[0],
  id: "99999999-9999-9999-9999-999999999999",
  title: "E2E Fixture Listing",
  images: [] as string[],
};

async function seedAuthCookie(page: Page) {
  // middleware.ts only checks presence of `access_token` cookie. We also
  // seed localStorage so the Authorization header is attached client-side.
  await page.addInitScript(() => {
    window.localStorage.setItem("access_token", "test-token");
  });
  await page.context().addCookies([
    {
      name: "access_token",
      value: "test-token",
      url: "http://localhost:3000",
    },
  ]);
}

async function stubBackend(page: Page, uploadedImageUrl: string) {
  // Authenticated API calls — we intercept every path the dashboard/form hits.
  await page.route("**/api/owners/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "owner-uuid",
        email: "owner@example.com",
        full_name: "E2E Owner",
        phone: null,
        role: "owner",
        is_verified: true,
        totp_enabled: false,
        created_at: "2026-01-01T00:00:00Z",
      }),
    });
  });
  await page.route("**/api/owners/portfolio", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        total_units: 0,
        occupied_units: 0,
        occupancy_rate: 0,
        monthly_revenue: 0,
        open_maintenance_tickets: 0,
        available_units: 0,
      }),
    });
  });

  const ownerListingsState: { items: typeof FIXTURE_PROPERTIES; total: number } = {
    items: [],
    total: 0,
  };

  await page.route("**/api/owners/properties**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(ownerListingsState),
    });
  });

  await page.route("**/api/properties", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    const created = { ...NEW_PROPERTY, images: [] };
    ownerListingsState.items = [created];
    ownerListingsState.total = 1;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(created),
    });
  });

  await page.route(`**/api/properties/${NEW_PROPERTY.id}/images`, async (route) => {
    // Respond with a presigned URL that points at our in-test stub host so
    // the subsequent browser PUT stays inside the page.route harness.
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        presigned_url: "https://test-stub-s3.example.com/upload/fixture.jpg",
        public_url: uploadedImageUrl,
      }),
    });
  });

  await page.route("https://test-stub-s3.example.com/**", async (route) => {
    if (route.request().method() === "PUT") {
      await route.fulfill({ status: 200, body: "" });
    } else {
      await route.fallback();
    }
  });
}

test.describe("Owner post-a-listing flow", () => {
  test("creates a property and uploads a photo via presigned PUT", async ({ page }) => {
    const uploadedImageUrl =
      "https://thepropertyfolio-media.s3.us-east-1.amazonaws.com/properties/99999999/test.jpg";
    await seedAuthCookie(page);
    await stubBackend(page, uploadedImageUrl);

    await page.goto("/owners/dashboard/properties/new");

    await page.getByTestId("field-title").fill(NEW_PROPERTY.title);
    await page.getByTestId("field-address").fill("123 E2E Way");
    await page.getByTestId("field-monthly-rent").fill("2400");

    // Attach a 1x1 PNG via the hidden file input.
    const tinyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64",
    );
    await page.getByTestId("file-input").setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: tinyPng,
    });

    const [uploadRequest] = await Promise.all([
      page.waitForRequest(
        (req) =>
          req.url().startsWith("https://test-stub-s3.example.com/") &&
          req.method() === "PUT",
      ),
      page.getByTestId("submit-new-property").click(),
    ]);

    expect(uploadRequest.method()).toBe("PUT");

    await expect(page).toHaveURL(/\/owners\/dashboard/);
  });

  test("owner dashboard PropertiesTab renders live listings", async ({ page }) => {
    await seedAuthCookie(page);
    await page.route("**/api/owners/me", async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "owner-uuid",
          email: "owner@example.com",
          full_name: "E2E Owner",
          phone: null,
          role: "owner",
          is_verified: true,
          totp_enabled: false,
          created_at: "2026-01-01T00:00:00Z",
        }),
      }),
    );
    await page.route("**/api/owners/portfolio", async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          total_units: 1,
          occupied_units: 0,
          occupancy_rate: 0,
          monthly_revenue: 0,
          open_maintenance_tickets: 0,
          available_units: 1,
        }),
      }),
    );
    await page.route("**/api/owners/properties**", async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [NEW_PROPERTY], total: 1 }),
      }),
    );

    await page.goto("/owners/dashboard");
    await page.getByRole("button", { name: /My Properties/i }).click();

    await expect(page.getByTestId("owner-property-card")).toBeVisible();
    await expect(page.getByText(NEW_PROPERTY.title)).toBeVisible();
  });
});
