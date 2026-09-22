import { describe, it, expect } from "vitest";
import { AVAILABLE_FIELDS, CATEGORIES } from "./CustomReportBuilderPage.constants";

describe("CustomReportBuilderPage constants", () => {
  it("AVAILABLE_FIELDS is a non-empty array", () => {
    expect(Array.isArray(AVAILABLE_FIELDS)).toBe(true);
    expect(AVAILABLE_FIELDS.length).toBeGreaterThan(0);
  });

  it("each field has required properties", () => {
    for (const field of AVAILABLE_FIELDS) {
      expect(typeof field.id).toBe("string");
      expect(typeof field.label).toBe("string");
      expect(typeof field.category).toBe("string");
      expect(typeof field.type).toBe("string");
      expect(typeof field.enabled).toBe("boolean");
    }
  });

  it("CATEGORIES has 5 entries", () => {
    expect(CATEGORIES).toEqual([
      "employee",
      "payroll",
      "earnings",
      "deductions",
      "benefits",
    ]);
  });
});
