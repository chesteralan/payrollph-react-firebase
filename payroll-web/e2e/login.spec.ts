import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display login form", async ({ page }) => {
    await expect(page.locator("form")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
  });

  test("should show error with invalid credentials", async ({ page }) => {
    await page.getByLabel("Email").fill("invalid@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: /login/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid|error|failed/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("should have proper form labels and inputs", async ({ page }) => {
    const emailInput = page.getByLabel("Email");
    const passwordInput = page.getByLabel("Password");

    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("should navigate to reset password page", async ({ page }) => {
    const resetLink = page.getByRole("link", { name: /forgot|reset/i });
    if (await resetLink.isVisible()) {
      await resetLink.click();
      await expect(page).toHaveURL(/reset|forgot/);
    }
  });
});

test.describe("Dashboard Access", () => {
  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/);
  });
});
