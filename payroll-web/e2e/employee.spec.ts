import { test, expect } from "@playwright/test";

test.describe("Employee Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    // Fill in login form with test credentials
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/**");
  });

  test("should display employee list page", async ({ page }) => {
    await page.goto("/employees");
    await expect(page.locator("h1")).toContainText(/employee/i);
  });

  test("should show search bar on employees page", async ({ page }) => {
    await page.goto("/employees");
    const searchInput = page.locator('input[placeholder*="search" i]');
    await expect(searchInput).toBeVisible();
  });

  test("should navigate to employee profile", async ({ page }) => {
    await page.goto("/employees");
    // Click on first employee row or add button
    const employeeLink = page.locator("a").filter({ hasText: /EMP/i }).first();
    if (await employeeLink.isVisible()) {
      await employeeLink.click();
      await expect(page).toHaveURL(/\/employees\//);
    }
  });
});
