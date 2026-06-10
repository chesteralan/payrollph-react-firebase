import { test, expect } from "@playwright/test";

test.describe("Payroll Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/**");
  });

  test("should display payroll runs page", async ({ page }) => {
    await page.goto("/payroll");
    await expect(page.locator("h1")).toContainText(/payroll/i);
  });

  test("should have new payroll button", async ({ page }) => {
    await page.goto("/payroll");
    const newBtn = page.locator("button", { hasText: /new/i }).first();
    await expect(newBtn).toBeVisible();
  });

  test("should navigate through wizard steps", async ({ page }) => {
    await page.goto("/payroll/new");
    await expect(page.locator("text=Payroll Setup Wizard")).toBeVisible();
    // Step indicators should be present
    const stepper = page.locator('[role="progressbar"]');
    await expect(stepper).toBeVisible();
  });
});
