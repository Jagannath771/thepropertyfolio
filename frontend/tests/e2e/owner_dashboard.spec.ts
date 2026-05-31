import { test, expect, Page } from "@playwright/test";

import { FIXTURE_PROPERTIES } from "./fixtures/properties";

/**
 * End-to-end coverage for the live owner dashboard tabs introduced in PR 3.
 * Every backend call is stubbed via page.route so the suite runs without a
 * live FastAPI/Postgres.
 */

const PROFILE = {
  id: "owner-uuid",
  email: "owner@example.com",
  full_name: "E2E Owner",
  phone: null,
  role: "owner",
  is_verified: true,
  totp_enabled: false,
  created_at: "2026-01-01T00:00:00Z",
};

const PORTFOLIO = {
  total_units: 2,
  occupied_units: 1,
  occupancy_rate: 50.0,
  monthly_revenue: 4200,
  open_maintenance_tickets: 1,
  available_units: 1,
  units_added_this_year: 2,
  revenue_last_30d: 4200,
  revenue_prev_30d: 3800,
  revenue_change_pct: 10.5,
};

const FINANCIALS = {
  revenue_series: Array.from({ length: 12 }).map((_, i) => ({
    month: `2026-${String(((i % 12) + 1)).padStart(2, "0")}`,
    revenue: 1000 * (i + 1),
  })),
  ytd_revenue: 42000,
  previous_ytd_revenue: 38000,
  ytd_change_pct: 10.5,
  ytd_expenses: 0,
  ytd_net_income: 42000,
  expenses_feature: "unreleased" as const,
  recent_transactions: [
    {
      id: "tx1",
      property_id: FIXTURE_PROPERTIES[0].id,
      amount: 2400,
      payment_type: "rent",
      paid_at: "2026-05-01T00:00:00Z",
      created_at: "2026-05-01T00:00:00Z",
    },
  ],
};

const APPLICATION_PENDING = {
  id: "app-1",
  property_id: FIXTURE_PROPERTIES[0].id,
  tenant_id: "tenant-uuid",
  status: "pending",
  personal_info: { full_name: "Applicant Alice" },
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

const MAINTENANCE_OPEN = {
  id: "maint-1",
  property_id: FIXTURE_PROPERTIES[0].id,
  tenant_id: "tenant-uuid",
  category: "Plumbing",
  description: "Leaking kitchen faucet",
  urgency: "medium",
  status: "open",
  photos: [],
  assigned_to: null,
  resolution_notes: null,
  created_at: "2026-05-01T00:00:00Z",
  resolved_at: null,
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
  await page.route("**/api/owners/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(PROFILE),
    }),
  );
  await page.route("**/api/owners/portfolio", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(PORTFOLIO),
    }),
  );
  // Query string `?months=12` is not matched by trailing `*` in some Playwright glob rules.
  await page.route(/\/api\/owners\/financials(\?|$)/, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(FINANCIALS),
    }),
  );
  await page.route("**/api/owners/properties*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [FIXTURE_PROPERTIES[0]], total: 1 }),
    }),
  );
}

test.describe("Owner dashboard — live data", () => {
  test("Overview shows live KPIs with computed change subtext", async ({ page }) => {
    await seedAuth(page);
    await stubCore(page);
    await page.goto("/owners/dashboard");

    await expect(page.getByTestId("overview-tab")).toBeVisible();
    await expect(page.getByText(/Portfolio Overview/)).toBeVisible();
    await expect(page.getByText(/\+2 this year/)).toBeVisible();
    await expect(page.getByText(/\+10\.5% vs prev 30d/)).toBeVisible();
  });

  test("Applications tab approves a pending application", async ({ page }) => {
    await seedAuth(page);
    await stubCore(page);
    await page.route("**/api/applications", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([APPLICATION_PENDING]),
      }),
    );
    let patchedWith = "";
    await page.route("**/api/applications/app-1", async (route) => {
      const req = route.request();
      patchedWith = req.postData() ?? "";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...APPLICATION_PENDING, status: "approved" }),
      });
    });

    await page.goto("/owners/dashboard");
    await page.getByRole("button", { name: /Applications/ }).click();
    await expect(page.getByTestId("applications-tab")).toBeVisible();
    await expect(page.getByTestId("application-row")).toBeVisible();

    await page.getByTestId("approve-btn").click();

    await expect.poll(() => patchedWith).toContain('"status":"approved"');
    await expect(page.getByText(/approved/i).first()).toBeVisible();
  });

  test("Financials tab renders live YTD + transactions", async ({ page }) => {
    await seedAuth(page);
    await stubCore(page);
    await page.goto("/owners/dashboard");
    await page.getByRole("button", { name: /Financials/ }).click();
    await expect(page.getByTestId("financials-tab")).toBeVisible();
    // Tab panel uses a short opacity animation; assert via test ids + text (not visibility-only).
    await expect(page.getByTestId("financials-ytd-revenue")).toHaveText("$42,000");
    await expect(page.getByText(/Recent transactions/)).toBeVisible();
    await expect(page.getByTestId("financials-tx-tx1-amount")).toHaveText("+$2,400");
  });

  test("Maintenance tab transitions an open request to resolved", async ({ page }) => {
    await seedAuth(page);
    await stubCore(page);
    await page.route("**/api/maintenance", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([MAINTENANCE_OPEN]),
      }),
    );
    let patchedWith = "";
    await page.route("**/api/maintenance/maint-1", async (route) => {
      patchedWith = route.request().postData() ?? "";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...MAINTENANCE_OPEN, status: "resolved" }),
      });
    });

    await page.goto("/owners/dashboard");
    await page.getByRole("button", { name: /Maintenance/ }).click();
    await expect(page.getByTestId("maintenance-tab")).toBeVisible();
    await expect(page.getByTestId("maintenance-row")).toBeVisible();

    await page.getByRole("button", { name: /Resolve/ }).click();

    await expect.poll(() => patchedWith).toContain('"status":"resolved"');
  });

  test("Settings tab renders profile data from /api/owners/me", async ({ page }) => {
    await seedAuth(page);
    await stubCore(page);
    await page.goto("/owners/dashboard");
    await page.getByRole("button", { name: /Settings/ }).click();
    await expect(page.getByTestId("settings-tab")).toBeVisible();
    await expect(page.getByTestId("settings-email")).toHaveValue(PROFILE.email);
    await expect(page.getByTestId("settings-full-name")).toHaveValue(PROFILE.full_name!);
  });
});
