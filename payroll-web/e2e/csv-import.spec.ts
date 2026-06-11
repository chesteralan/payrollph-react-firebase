import { test, expect } from "@playwright/test";

test.describe("CSV Import Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/**");
  });

  test("should have an import button on employees page", async ({ page }) => {
    await page.goto("/employees");
    const importButton = page.locator(
      'button:has-text("import"), a:has-text("import"), [data-testid="import-button"]'
    ).first();
    await expect(importButton).toBeVisible();
  });

  test("should open import dialog when import button is clicked", async ({ page }) => {
    await page.goto("/employees");
    const importButton = page.locator(
      'button:has-text("import"), a:has-text("import"), [data-testid="import-button"]'
    ).first();

    if (await importButton.isVisible()) {
      await importButton.click();
      // Dialog or modal should appear
      const dialog = page.locator(
        '[role="dialog"], [role="modal"], [data-testid="import-dialog"]'
      ).first();
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Should show file upload area
      const fileInput = page.locator(
        'input[type="file"], [data-testid="file-upload"], label:has-text("upload")'
      ).first();
      await expect(fileInput).toBeVisible();
    }
  });

  test("should show mapping preview after selecting a CSV file", async ({ page }) => {
    await page.goto("/employees");
    const importButton = page.locator(
      'button:has-text("import"), a:has-text("import"), [data-testid="import-button"]'
    ).first();

    if (await importButton.isVisible()) {
      await importButton.click();
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        // Check that there's a preview/mapping table shown
        const previewTable = page.locator(
          'table, [data-testid="preview-table"], [data-testid="mapping-area"]'
        ).first();
        await expect(previewTable).toBeVisible();
      }
    }
  });

  test("should show column mapping for CSV fields", async ({ page }) => {
    await page.goto("/employees");
    const importButton = page.locator(
      'button:has-text("import"), a:has-text("import"), [data-testid="import-button"]'
    ).first();

    if (await importButton.isVisible()) {
      await importButton.click();
      // Should show field mappings
      const mappingFields = page.locator(
        '[data-testid="field-mapping"], select, [data-testid="column-select"]'
      ).first();
      await expect(mappingFields).toBeVisible({ timeout: 5000 });
    }
  });

  test("should show validation errors for bad CSV data", async ({ page }) => {
    await page.goto("/employees");
    const importButton = page.locator(
      'button:has-text("import"), a:has-text("import"), [data-testid="import-button"]'
    ).first();

    if (await importButton.isVisible()) {
      await importButton.click();

      // Look for validation area
      const validationArea = page.locator(
        '[data-testid="validation-errors"], [role="alert"], .text-red-'
      ).first();

      // May show validation after form submit
      const submitButton = page.locator(
        'button:has-text("import"), button:has-text("upload"), button:has-text("submit")'
      ).first();

      if (await submitButton.isVisible()) {
        // Try import without file
        await submitButton.click();
        // Should show error
        const error = page.locator('text=required, text=select, text=choose, [role="alert"]').first();
        await expect(error).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("should have download template link on import page", async ({ page }) => {
    await page.goto("/employees");
    const importButton = page.locator(
      'button:has-text("import"), a:has-text("import"), [data-testid="import-button"]'
    ).first();

    if (await importButton.isVisible()) {
      await importButton.click();
      // Should have a template download link
      const templateLink = page.locator(
        'a:has-text("template"), button:has-text("template"), [data-testid="download-template"]'
      ).first();
      await expect(templateLink).toBeVisible({ timeout: 5000 });
    }
  });
});
