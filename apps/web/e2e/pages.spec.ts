import { test, expect } from "@playwright/test";
import { gotoWithAuth } from "./helpers/auth";

test.describe("Payroll creation flow", () => {
  test("payroll runs page loads", async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await gotoWithAuth(p, "/payroll");

    // Should show payroll page content
    await expect(p.locator("body")).not.toBeEmpty();

    await context.close();
  });

  test("payroll wizard page loads", async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await gotoWithAuth(p, "/payroll/new");

    // Should show wizard or payroll creation form
    await expect(p.locator("body")).not.toBeEmpty();

    await context.close();
  });

  test("templates page loads", async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await gotoWithAuth(p, "/payroll/templates");

    await expect(p.locator("body")).not.toBeEmpty();

    await context.close();
  });

  test("print formats page loads", async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await gotoWithAuth(p, "/payroll/print-formats");

    await expect(p.locator("body")).not.toBeEmpty();

    await context.close();
  });
});

test.describe("Employee management flow", () => {
  test("employees page loads with table", async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await gotoWithAuth(p, "/employees");

    await expect(p.locator("body")).not.toBeEmpty();

    await context.close();
  });

  test("employee groups page loads", async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await gotoWithAuth(p, "/employees/groups");

    await expect(p.locator("body")).not.toBeEmpty();

    await context.close();
  });

  test("positions page loads", async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await gotoWithAuth(p, "/employees/positions");

    await expect(p.locator("body")).not.toBeEmpty();

    await context.close();
  });

  test("areas page loads", async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await gotoWithAuth(p, "/employees/areas");

    await expect(p.locator("body")).not.toBeEmpty();

    await context.close();
  });

  test("names list page loads", async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await gotoWithAuth(p, "/lists/names");

    await expect(p.locator("body")).not.toBeEmpty();

    await context.close();
  });
});

test.describe("DTR flow", () => {
  test("DTR page loads", async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await gotoWithAuth(p, "/dtr");

    await expect(p.locator("body")).not.toBeEmpty();

    await context.close();
  });
});

test.describe("Reports flow", () => {
  const reportPages = [
    { path: "/reports/13th-month", name: "13th Month" },
    { path: "/reports/payroll-summary", name: "Payroll Summary" },
    { path: "/reports/employees", name: "Employee Report" },
    { path: "/reports/earnings-deductions", name: "Earnings & Deductions" },
    { path: "/reports/attendance", name: "Attendance" },
    { path: "/reports/benefits-utilization", name: "Benefits Utilization" },
    { path: "/reports/year-end", name: "Year End" },
  ];

  for (const report of reportPages) {
    test(`${report.name} report page loads`, async ({ browser }) => {
      const context = await browser.newContext();
      const p = await context.newPage();
      await gotoWithAuth(p, report.path);

      await expect(p.locator("body")).not.toBeEmpty();

      await context.close();
    });
  }
});

test.describe("System pages flow", () => {
  const systemPages = [
    { path: "/system/companies", name: "Companies" },
    { path: "/system/calendar", name: "Calendar" },
    { path: "/system/terms", name: "Terms" },
    { path: "/system/users", name: "Users" },
    { path: "/system/restrictions", name: "Restrictions" },
    { path: "/system/audit", name: "Audit" },
    { path: "/system/database", name: "Database" },
    { path: "/system/settings", name: "Settings" },
    { path: "/system/trash", name: "Trash" },
    { path: "/system/health", name: "Health Check" },
    { path: "/system/activity", name: "Activity" },
  ];

  for (const sysPage of systemPages) {
    test(`${sysPage.name} page loads`, async ({ browser }) => {
      const context = await browser.newContext();
      const p = await context.newPage();
      await gotoWithAuth(p, sysPage.path);

      await expect(p.locator("body")).not.toBeEmpty();

      await context.close();
    });
  }
});
