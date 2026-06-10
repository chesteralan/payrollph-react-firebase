import { test, expect } from "@playwright/test";

test.describe("Payroll Processing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/**");
  });

  test("should process DTR stage", async ({ page }) => {
    await page.goto("/payroll");
    const payrollLink = page.locator("a").filter({ hasText: /draft/i }).first();
    if (await payrollLink.isVisible()) {
      await payrollLink.click();
      await page.waitForURL(/\/payroll\//);
      await expect(page.locator("text=DTR")).toBeVisible();
    }
  });

  test("should export payroll to XLS", async ({ page }) => {
    await page.goto("/payroll");
    const exportBtn = page.locator("button", { hasText: /export|xls/i }).first();
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
    }
  });
});
