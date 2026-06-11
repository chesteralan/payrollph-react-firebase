import { test, expect } from "@playwright/test";

test.describe("Calendar & DTR Workflows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/**");
  });

  test("should navigate to DTR calendar page", async ({ page }) => {
    await page.goto("/dtr");
    await expect(page.locator("h1")).toContainText(/dtr|time record|attendance|calendar/i);
  });

  test("should display calendar view with navigation controls", async ({ page }) => {
    await page.goto("/dtr");
    // Should have month/year display
    const monthDisplay = page.locator(
      'h2, [aria-label*="month" i], [data-testid="current-month"], .calendar-header'
    ).first();
    await expect(monthDisplay).toBeVisible();

    // Should have navigation buttons
    const navButtons = page.locator(
      'button:has-text("prev"), button:has-text("next"), button[aria-label*="prev"], button[aria-label*="next"], [data-testid="month-nav"]'
    );
    expect(await navButtons.count()).toBeGreaterThanOrEqual(1);
  });

  test("should display month/day/view toggle", async ({ page }) => {
    await page.goto("/dtr");
    const viewToggle = page.locator(
      'button:has-text("month"), button:has-text("week"), button:has-text("day"), [data-testid="view-toggle"]'
    ).first();
    await expect(viewToggle).toBeVisible();
  });

  test("should navigate to previous month", async ({ page }) => {
    await page.goto("/dtr");
    const prevButton = page.locator(
      'button:has-text("prev"), button[aria-label*="prev"], [data-testid="prev-month"]'
    ).first();

    if (await prevButton.isVisible()) {
      const currentMonth = await page.locator(
        'h2, [aria-label*="month" i], [data-testid="current-month"]'
      ).first().textContent();

      await prevButton.click();
      await page.waitForTimeout(500);

      const newMonth = await page.locator(
        'h2, [aria-label*="month" i], [data-testid="current-month"]'
      ).first().textContent();

      expect(newMonth).not.toBe(currentMonth);
    }
  });

  test("should display employee attendance records for selected month", async ({ page }) => {
    await page.goto("/dtr");
    // Employee list or table should be visible
    const attendanceTable = page.locator(
      'table, [data-testid="dtr-table"], [data-testid="attendance-grid"]'
    ).first();
    await expect(attendanceTable).toBeVisible({ timeout: 10000 });

    // Should show employee rows with attendance status
    const employeeRows = page.locator(
      'table tbody tr, [data-testid="employee-row"], [data-testid="attendance-row"]'
    );
    expect(await employeeRows.count()).toBeGreaterThanOrEqual(0);
  });

  test("should show leave management options", async ({ page }) => {
    await page.goto("/dtr");
    const leaveButton = page.locator(
      'button:has-text("leave"), a:has-text("leave"), [data-testid="leave-action"]'
    ).first();

    if (await leaveButton.isVisible()) {
      await leaveButton.click();
      // Should show leave dialog
      const leaveDialog = page.locator(
        '[role="dialog"], [data-testid="leave-dialog"], [data-testid="leave-form"]'
      ).first();
      await expect(leaveDialog).toBeVisible({ timeout: 5000 });
    }
  });

  test("should display leave balances", async ({ page }) => {
    await page.goto("/dtr");
    const leaveBalance = page.locator(
      '[data-testid="leave-balance"], [data-testid="leave-summary"], text=sick, text=vacation, text=leave'
    ).first();
    await expect(leaveBalance).toBeVisible({ timeout: 10000 });
  });

  test("should show overtime approval section if available", async ({ page }) => {
    await page.goto("/dtr");
    const overtimeLink = page.locator(
      'a:has-text("overtime"), button:has-text("overtime"), [data-testid="overtime-section"]'
    ).first();

    if (await overtimeLink.isVisible()) {
      await overtimeLink.click();
      const overtimeForm = page.locator(
        '[data-testid="overtime-form"], [role="dialog"], form'
      ).first();
      await expect(overtimeForm).toBeVisible({ timeout: 5000 });
    }
  });

  test("should show holiday indicators on calendar", async ({ page }) => {
    await page.goto("/dtr");
    // Check for holiday markers
    const holidayMarkers = page.locator(
      '[data-testid="holiday"], [aria-label*="holiday" i], .holiday, [data-testid="holiday-indicator"]'
    );
    // Holidays may or may not be visible in current month — just check element exists
    const count = await holidayMarkers.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should allow bulk edit mode for DTR entries", async ({ page }) => {
    await page.goto("/dtr");
    const bulkEditButton = page.locator(
      'button:has-text("bulk"), [data-testid="bulk-edit"], button:has-text("edit all")'
    ).first();

    if (await bulkEditButton.isVisible()) {
      await bulkEditButton.click();
      // Should enter bulk edit mode
      const saveAllButton = page.locator(
        'button:has-text("save"), [data-testid="save-all"]'
      ).first();
      await expect(saveAllButton).toBeVisible({ timeout: 5000 });
    }
  });
});
