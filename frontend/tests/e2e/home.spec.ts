import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/ThePropertyFolio/);
  });

  test("hero section is visible with headline", async ({ page }) => {
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Perfected");
  });

  test("navbar is visible with logo", async ({ page }) => {
    const nav = page.locator("header");
    await expect(nav).toBeVisible();
    await expect(nav).toContainText("PropertyFolio");
  });

  test("Find a Home CTA links to availability", async ({ page }) => {
    const cta = page.getByRole("link", { name: /find a home/i }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/availability");
  });

  test("services grid shows 6 cards", async ({ page }) => {
    await page.waitForSelector("text=Everything You Need");
    await expect(page.getByRole("heading", { name: "Property Listings" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tenant Screening" })).toBeVisible();
  });

  test("chatbot bubble is visible", async ({ page }) => {
    const bubble = page.getByRole("button", { name: /open ai chat/i });
    await expect(bubble).toBeVisible();
  });

  test("chatbot opens on click", async ({ page }) => {
    await page.getByRole("button", { name: /open ai chat/i }).click();
    await expect(page.locator("text=TPF Assistant")).toBeVisible();
  });

  test("footer has newsletter form", async ({ page }) => {
    await page.locator("footer").scrollIntoViewIfNeeded();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("mobile menu opens correctly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole("button", { name: /toggle menu/i }).click();
    await expect(page.getByRole("navigation").locator("text=About")).toBeVisible();
  });
});
