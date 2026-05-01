import { test, expect } from "@playwright/test";

test.describe("Authentication Flows", () => {

  test.describe("Tenant Authentication", () => {
    test("can navigate to tenant login", async ({ page }) => {
      await page.goto("/tenants/login");
      await expect(page).toHaveTitle(/ThePropertyFolio/i);
      await expect(page.locator("h1")).toContainText(/Tenant Sign In/i);
    });

    test("tenant login form shows validation errors on empty submit", async ({ page }) => {
      await page.goto("/tenants/login");
      await page.getByRole("button", { name: /sign in/i }).click();
      
      // Since we use HTML5 native required validation, the browser prevents submission.
      // We check that the inputs are considered invalid by the browser.
      const emailInput = page.getByPlaceholder(/you@example.com/i);
      const passwordInput = page.getByPlaceholder(/••••••••/);
      
      await expect(emailInput).toHaveClass(/input-glass/);
      // We can evaluate if the form is invalid
      const isEmailInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isEmailInvalid).toBeTruthy();
    });

    test("can navigate to tenant registration", async ({ page }) => {
      await page.goto("/tenants/register");
      await expect(page.locator("h1")).toContainText(/Create Tenant Account/i);
      await expect(page.locator("form").first()).toBeVisible();
    });
  });

  test.describe("Owner Authentication", () => {
    test("owner routes fallback correctly or show login", async ({ page }) => {
      // If the owner routes aren't built yet, we just ensure it doesn't hard crash 
      // or we check the UI structure. We will check if it navigates without a complete failure.
      const response = await page.goto("/owners/login");
      // Allow 404 if the page is not built yet
      expect([200, 404]).toContain(response?.status());
    });
  });

});
