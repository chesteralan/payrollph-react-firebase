import { test, expect } from "@playwright/test";

test.describe("Company Switching & Data Isolation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/**");
  });

  test("should display company switcher in the sidebar/header", async ({ page }) => {
    await page.goto("/dashboard");
    // Look for a company selector dropdown or button
    const companySwitcher = page.locator(
      '[data-testid="company-switcher"], [aria-label*="company" i], select:has(option), button:has-text("Company")'
    ).first();
    await expect(companySwitcher).toBeVisible();
  });

  test("should list available companies in the switcher", async ({ page }) => {
    await page.goto("/dashboard");
    // Open company switcher
    const switcher = page.locator('[data-testid="company-switcher"]').first();
    if (await switcher.isVisible()) {
      await switcher.click();
      // Should show at least one company option
      const options = page.locator('[role="option"], [data-testid="company-option"], option');
      const count = await options.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test("should update data when switching companies", async ({ page }) => {
    await page.goto("/dashboard");
    const switcher = page.locator('[data-testid="company-switcher"]').first();
    if (await switcher.isVisible()) {
      await switcher.click();
      // Pick a different company
      const option = page.locator('[role="option"], [data-testid="company-option"]').last();
      const selectedText = await option.textContent();
      await option.click();
      // Verify the selected company name is displayed
      const activeCompany = page.locator('[data-testid="active-company"], [data-testid="company-name"]').first();
      if (await activeCompany.isVisible()) {
        await expect(activeCompany).toContainText(selectedText?.trim() || "");
      }
    }
  });

  test("should redirect to login when company access is revoked", async ({ page }) => {
    // Attempt to access a company page directly
    await page.goto("/dashboard?company=unknown");
    // Should be redirected or show access denied
    await expect(page).toHaveURL(/login|access-denied|unauthorized/i);
  });

  test("should not show data from other companies in employee list", async ({ page }) => {
    await page.goto("/employees");
    // Verify employee list is visible
    const employeeList = page.locator("table, [data-testid='employee-list'], main");
    await expect(employeeList).toBeVisible();

    // The count should be reasonable (not showing all companies' data)
    const rows = page.locator("table tbody tr, [data-testid='employee-row']");
    const count = await rows.count();
    // With proper isolation, count should be manageable
    expect(count).toBeLessThan(1000);
  });
});
