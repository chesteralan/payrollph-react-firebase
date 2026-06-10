import { test, expect } from "@playwright/test";

test.describe("RBAC Enforcement", () => {
  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/employees");
    await expect(page).toHaveURL("/login");
  });

  test("should show login page for protected routes", async ({ page }) => {
    await page.goto("/payroll");
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
