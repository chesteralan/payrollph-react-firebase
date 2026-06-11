import { test, expect } from "@playwright/test";

test.describe("Visual Regression — Key Pages", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/**");
  });

  test("login page should match snapshot", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    // Full page screenshot for visual comparison
    await expect(page).toHaveScreenshot("login-page.png", {
      fullPage: true,
      animations: "disabled",
    });
  });

  test("dashboard page should match snapshot", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("dashboard-page.png", {
      fullPage: true,
      animations: "disabled",
    });
  });

  test("employee list page should match snapshot", async ({ page }) => {
    await page.goto("/employees");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("employees-page.png", {
      fullPage: true,
      animations: "disabled",
    });
  });

  test("payroll list page should match snapshot", async ({ page }) => {
    await page.goto("/payroll");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("payroll-page.png", {
      fullPage: true,
      animations: "disabled",
    });
  });

  test("reports page should match snapshot", async ({ page }) => {
    await page.goto("/reports");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("reports-page.png", {
      fullPage: true,
      animations: "disabled",
    });
  });

  test("DTR calendar page should match snapshot", async ({ page }) => {
    await page.goto("/dtr");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("dtr-page.png", {
      fullPage: true,
      animations: "disabled",
    });
  });

  test("responsive mobile viewport should match snapshot", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("dashboard-mobile.png", {
      fullPage: true,
      animations: "disabled",
    });
  });

  test("responsive tablet viewport should match snapshot", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("dashboard-tablet.png", {
      fullPage: true,
      animations: "disabled",
    });
  });
});
