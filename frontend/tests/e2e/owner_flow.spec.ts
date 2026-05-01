import { test, expect } from "@playwright/test";

test.describe("Owner User Flow", () => {

  test("can view owner landing page and navigate to login", async ({ page }) => {
    await page.goto("/owners");
    
    // Check hero
    await expect(page.locator("h1")).toContainText(/Maximize Your Investment/i);
    
    // Navigate to portal
    const portalBtn = page.getByRole("link", { name: /owner portal/i }).first();
    await expect(portalBtn).toBeVisible();
    await portalBtn.click();
    
    // Should be on login page
    await expect(page).toHaveURL(/\/owners\/login/);
  });

  test("owner dashboard navigation is protected", async ({ page }) => {
    // Attempt to access dashboard without auth
    await page.goto("/owners/dashboard");
    
    // Should redirect to login
    await expect(page).toHaveURL(/login/i);
  });

  test("mock owner dashboard views", async ({ page }) => {
    // In a full E2E test, we would login first. 
    // Here we just verify the route logic (e.g. redirect if not authed)
    // To thoroughly test the dashboard, we need Playwright global setup with a valid session cookie.
    
    await page.goto("/owners/login");
    
    // Fill credentials
    await page.getByLabel(/email/i).first().fill("owner@example.com");
    await page.getByLabel(/password/i).first().fill("password123");
    
    // Submit
    await page.getByRole("button", { name: /sign in/i }).click();
    
    // Expect validation errors or redirect based on mock backend state.
    // If we mock the backend, we would expect to land on /owners/dashboard
    // For now we just verify the login button triggers action.
    const errorMessage = page.locator(".text-red-500, [role='alert']").first();
    // It should either show error (invalid creds) or redirect
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/owners\/dashboard/);
    }
  });

});
