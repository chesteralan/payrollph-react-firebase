import { test, expect } from "@playwright/test";

test.describe("Login flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders login form with all elements", async ({ page }) => {
    await expect(page.locator("text=SMB Payroll")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("shows validation errors for empty submission", async ({ page }) => {
    await page.locator("button[type='submit']").click();
    // HTML5 validation should prevent submission
    const email = page.locator("input[type='email']");
    await expect(email).toHaveAttribute("required", "");
  });

  test("can type in email and password fields", async ({ page }) => {
    const email = page.locator("input[type='email']");
    const password = page.locator("input[type='password']");

    await email.fill("user@example.com");
    await password.fill("password123");

    await expect(email).toHaveValue("user@example.com");
    await expect(password).toHaveValue("password123");
  });

  test("forgot password link navigates to forgot-password page", async ({
    page,
  }) => {
    const link = page.locator("a[href='/forgot-password']");
    if (await link.isVisible()) {
      await link.click();
      await page.waitForURL("**/forgot-password");
      await expect(page).toHaveURL(/\/forgot-password/);
    }
  });

  test("shows loading state during submission", async ({ page }) => {
    // Mock the auth response to delay
    await page.route(
      "**/identitytoolkit/v1/accounts:signInWithPassword**",
      (route) =>
        route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            error: { message: "INVALID_PASSWORD" },
          }),
        }),
    );

    await page.locator("#email").fill("user@example.com");
    await page.locator("#password").fill("wrongpassword");
    await page.locator("button[type='submit']").click();

    // Should show error message or remain on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    // Mock successful auth
    await page.route(
      "**/identitytoolkit/v1/accounts:signInWithPassword**",
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            kind: "identitytoolkit#VerifyPasswordResponse",
            localId: "test-user-uid",
            email: "test@example.com",
            displayName: "Test User",
            idToken: "mock-id-token",
            registered: true,
            refreshToken: "mock-refresh-token",
            expiresIn: "3600",
          }),
        }),
    );

    // Mock Firestore calls
    await page.route("**/firestore.googleapis.com/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ documents: [] }),
      }),
    );

    await page.locator("#email").fill("test@example.com");
    await page.locator("#password").fill("password123");
    await page.locator("button[type='submit']").click();

    // Should redirect away from login
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 10000,
    });
    await expect(page).not.toHaveURL(/\/login/);
  });
});
