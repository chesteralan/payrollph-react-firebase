import { type Page } from "@playwright/test";

/**
 * Mock Firebase Auth to simulate an authenticated user.
 * Intercepts the Identity Toolkit API calls and returns mock responses.
 */
export async function mockFirebaseAuth(page: Page) {
  // Mock the identitytoolkit verifyPassword response
  await page.route("**/identitytoolkit/v1/accounts:signInWithPassword**", (route) =>
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

  // Mock the SecureToken API refresh
  await page.route("**/securetoken/v1/token**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "mock-access-token",
        expires_in: "3600",
        token_type: "Bearer",
        refresh_token: "mock-refresh-token",
      }),
    }),
  );

  // Mock Firestore REST API calls
  await page.route("**/firestore.googleapis.com/**", (route) => {
    const url = route.request().url();

    // Mock companies query
    if (url.includes("/documents/companies")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          documents: [
            {
              name: "projects/test/databases/(default)/documents/companies/test-company",
              fields: {
                name: { stringValue: "Test Company" },
                isActive: { booleanValue: true },
              },
              createTime: "2024-01-01T00:00:00Z",
              updateTime: "2024-01-01T00:00:00Z",
            },
          ],
        }),
      });
    }

    // Mock employees query
    if (url.includes("/documents/employees")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ documents: [] }),
      });
    }

    // Mock payroll query
    if (url.includes("/documents/payroll")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ documents: [] }),
      });
    }

    // Mock scheduled_reports query
    if (url.includes("/documents/scheduled_reports")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ documents: [] }),
      });
    }

    // Mock report_runs query
    if (url.includes("/documents/report_runs")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ documents: [] }),
      });
    }

    // Default: return empty response for other Firestore calls
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ documents: [] }),
    });
  });

  // Mock Firebase Auth REST API for token refresh
  await page.route("**/identitytoolkit/v1/accounts:lookup**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        kind: "identitytoolkit#GetAccountInfoResponse",
        users: [
          {
            localId: "test-user-uid",
            email: "test@example.com",
            displayName: "Test User",
          },
        ],
      }),
    }),
  );
}

/**
 * Navigate to a page with Firebase auth mocked.
 */
export async function gotoWithAuth(page: Page, path: string) {
  await mockFirebaseAuth(page);
  await page.goto(path);
  // Wait for the app to initialize
  await page.waitForLoadState("networkidle");
}
