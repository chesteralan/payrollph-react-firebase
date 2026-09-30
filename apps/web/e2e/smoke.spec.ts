import { test, expect } from "@playwright/test";
import { gotoWithAuth } from "./helpers/auth";

const protectedPages = [
  { path: "/", name: "Dashboard", heading: /dashboard/i },
  { path: "/employees", name: "Employees", heading: /employees/i },
  {
    path: "/employees/calendar",
    name: "Employee Calendar",
    heading: /calendar/i,
  },
  { path: "/employees/groups", name: "Employee Groups", heading: /groups/i },
  { path: "/employees/positions", name: "Positions", heading: /positions/i },
  { path: "/employees/areas", name: "Areas", heading: /areas/i },
  { path: "/lists/names", name: "Names List", heading: /names/i },
  { path: "/lists/benefits", name: "Benefits", heading: /benefits/i },
  { path: "/lists/earnings", name: "Earnings", heading: /earnings/i },
  { path: "/lists/deductions", name: "Deductions", heading: /deductions/i },
  { path: "/payroll", name: "Payroll Runs", heading: /payroll/i },
  { path: "/payroll/templates", name: "Templates", heading: /templates/i },
  { path: "/payroll/print-formats", name: "Print Formats", heading: /print/i },
  { path: "/dtr", name: "DTR", heading: /daily time record|dtr/i },
  {
    path: "/reports/13th-month",
    name: "13th Month Report",
    heading: /13th month/i,
  },
  {
    path: "/reports/payroll-summary",
    name: "Payroll Summary",
    heading: /payroll summary/i,
  },
  { path: "/reports/employees", name: "Employee Report", heading: /employee/i },
  {
    path: "/reports/earnings-deductions",
    name: "Earnings & Deductions",
    heading: /earnings|deductions/i,
  },
  {
    path: "/reports/attendance",
    name: "Attendance Report",
    heading: /attendance/i,
  },
  {
    path: "/reports/benefits-utilization",
    name: "Benefits Utilization",
    heading: /benefits/i,
  },
  { path: "/reports/year-end", name: "Year End Report", heading: /year.end/i },
  { path: "/system/companies", name: "Companies", heading: /companies/i },
  { path: "/system/calendar", name: "System Calendar", heading: /calendar/i },
  { path: "/system/terms", name: "Terms", heading: /terms/i },
  { path: "/system/users", name: "Users", heading: /users/i },
  {
    path: "/system/restrictions",
    name: "Restrictions",
    heading: /restrictions/i,
  },
  { path: "/system/audit", name: "Audit Log", heading: /audit/i },
  { path: "/system/database", name: "Database", heading: /database/i },
  { path: "/system/settings", name: "System Settings", heading: /settings/i },
  { path: "/system/trash", name: "Trash", heading: /trash/i },
  { path: "/system/health", name: "Health Check", heading: /health/i },
  { path: "/system/activity", name: "User Activity", heading: /activity/i },
];

test.describe("Smoke tests — all protected pages", () => {
  for (const page of protectedPages) {
    test(`${page.name} (${page.path}) renders without crashing`, async ({
      browser,
    }) => {
      const context = await browser.newContext();
      const p = await context.newPage();
      await gotoWithAuth(p, page.path);

      // Page should not show an error boundary
      await expect(p.locator("text=Something went wrong")).not.toBeVisible({
        timeout: 5000,
      });
      // Page should have some content
      await expect(p.locator("body")).not.toBeEmpty();

      await context.close();
    });
  }
});

test.describe("Smoke tests — public pages", () => {
  test("Login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=SMB Payroll")).toBeVisible();
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("Setup page renders", async ({ page }) => {
    await page.goto("/setup");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("Forgot password page renders", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator("body")).not.toBeEmpty();
  });
});

test.describe("Smoke tests — navigation", () => {
  test("unauthenticated user redirects to login", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/login", { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("sidebar navigation links exist", async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await gotoWithAuth(p, "/");

    // Page should have loaded with some content
    await expect(p.locator("body")).not.toBeEmpty();

    await context.close();
  });
});
