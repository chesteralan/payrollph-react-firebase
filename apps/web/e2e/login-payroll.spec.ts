import { test, expect } from "@playwright/test";

test.describe("Login flow", () => {
  test("renders login page with form elements", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=SMB Payroll")).toBeVisible();
    await expect(page.locator("text=Sign in")).toBeVisible();
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });
});
