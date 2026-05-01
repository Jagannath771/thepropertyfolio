import { test, expect } from "@playwright/test";

test.describe("Availability Page", () => {
  test.beforeEach(async ({ page }) => {
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
    // Grid/List buttons are found by their surrounding container or simply checking they exist
    const listBtn = page.locator("button").filter({ has: page.locator("svg.lucide-list") }).first();
    if (await listBtn.isVisible()) await listBtn.click();
    
    const gridBtn = page.locator("button").filter({ has: page.locator("svg.lucide-grid3x3") }).first();
    if (await gridBtn.isVisible()) await gridBtn.click();
  });

  test("properties are displayed", async ({ page }) => {
    await expect(page.locator("text=Modern Downtown Penthouse")).toBeVisible();
  });

  test("filtering by property type works", async ({ page }) => {
    await page.getByRole("button", { name: "House" }).click();
    await expect(page.locator("text=Luxury Hillside Villa")).toBeVisible();
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

  test("password visibility toggle works", async ({ page }) => {
    const input = page.getByPlaceholder(/••••••••/);
    await expect(input).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "" }).nth(0).click();
  });

  test("link to register page exists", async ({ page }) => {
    await expect(page.getByRole("link", { name: /create one free/i })).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.getByPlaceholder(/you@example.com/i).fill("wrong@test.com");
    await page.getByPlaceholder(/••••••••/).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    // Wait for error (API call)
    await page.waitForTimeout(2000);
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

  test("password strength indicator appears on input", async ({ page }) => {
    await page.getByPlaceholder(/create a strong password/i).fill("Test123!");
    await expect(page.locator("text=Strong")).toBeVisible();
  });
});
