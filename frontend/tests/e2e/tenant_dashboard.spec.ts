import { test, expect, Page } from "@playwright/test";

const PROFILE = {
  id: "tenant-uuid",
  email: "tenant@example.com",
  full_name: "E2E Tenant",
  phone: null,
  role: "tenant",
  is_verified: true,
  created_at: "2026-01-01T00:00:00Z",
};

const APPLICATION = {
  id: "app-tenant-1",
  property_id: "11111111-1111-1111-1111-111111111111",
  tenant_id: "tenant-uuid",
  status: "pending",
  personal_info: { full_name: "E2E Tenant" },
  employment_info: null,
  rental_history: null,
  references: null,
  document_urls: [],
  background_check_consent: true,
  owner_notes: null,
  submitted_at: "2026-05-01T00:00:00Z",
  reviewed_at: null,
  created_at: "2026-05-01T00:00:00Z",
};

async function seedAuth(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("access_token", "test-token");
  });
  await page.context().addCookies([
    { name: "access_token", value: "test-token", url: "http://localhost:3000" },
  ]);
}

async function stubCore(page: Page) {
  await page.route("**/api/tenants/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(PROFILE),
    }),
  );
  await page.route(
    (url) => url.pathname.startsWith("/api/applications/stream"),
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: ": ok\n\n",
      }),
  );
  await page.route(
    (url) => url.pathname === "/api/applications",
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([APPLICATION]),
      }),
  );
  await page.route("**/api/payments", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    }),
  );
  await page.route("**/api/maintenance", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    }),
  );
  await page.route("**/api/messages", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    }),
  );
  await page.route("**/api/tenants/documents", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [] }),
    }),
  );
}

test.describe("Tenant dashboard — live data", () => {
  test("Overview loads profile and KPIs", async ({ page }) => {
    await seedAuth(page);
    await stubCore(page);
    await page.goto("/tenants/dashboard");
    await expect(page.getByTestId("tenant-overview-tab")).toBeVisible();
    await expect(page.getByText(/Welcome back, E2E/)).toBeVisible();
  });

  test("Applications tab lists stubbed application", async ({ page }) => {
    await seedAuth(page);
    await stubCore(page);
    await page.goto("/tenants/dashboard");
    await page.getByTestId("tenant-nav-application").click();
    await expect(page.getByTestId("tenant-application-tab")).toBeVisible();
    await expect(page.getByTestId("tenant-application-row")).toBeVisible();
  });

  test("Settings shows email from profile", async ({ page }) => {
    await seedAuth(page);
    await stubCore(page);
    await page.goto("/tenants/dashboard");
    await page.getByRole("button", { name: /Settings/i }).click();
    await expect(page.getByTestId("tenant-settings-tab")).toBeVisible();
    await expect(page.getByTestId("tenant-settings-email")).toHaveValue(PROFILE.email);
  });
});
