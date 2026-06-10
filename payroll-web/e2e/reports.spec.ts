import { test, expect } from "@playwright/test";

test.describe("Reports", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/**");
  });

  test("should navigate to 13th month report", async ({ page }) => {
    await page.goto("/reports/13th-month");
    await expect(page.locator("h1")).toContainText(/13th/i);
  });

  test("should navigate to payroll summary report", async ({ page }) => {
    await page.goto("/reports/payroll-summary");
    await expect(page.locator("h1")).toContainText(/summary/i);
  });

  test("should navigate to attendance report", async ({ page }) => {
    await page.goto("/reports/attendance");
    await expect(page.locator("h1")).toContainText(/attendance/i);
  });
});
