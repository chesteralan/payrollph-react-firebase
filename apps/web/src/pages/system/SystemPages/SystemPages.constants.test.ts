import { describe, it, expect } from "vitest";
import { DEPARTMENTS, COLLECTIONS } from "./SystemPages.constants";

describe("SystemPages constants", () => {
  it("DEPARTMENTS is a non-empty array", () => {
    expect(Array.isArray(DEPARTMENTS)).toBe(true);
    expect(DEPARTMENTS.length).toBeGreaterThan(0);
  });

  it("each department has key and sections", () => {
    for (const dept of DEPARTMENTS) {
      expect(typeof dept.key).toBe("string");
      expect(Array.isArray(dept.sections)).toBe(true);
    }
  });

  it("COLLECTIONS is a non-empty array of strings", () => {
    expect(Array.isArray(COLLECTIONS)).toBe(true);
    expect(COLLECTIONS.length).toBeGreaterThan(0);
    for (const col of COLLECTIONS) {
      expect(typeof col).toBe("string");
    }
  });

  it("COLLECTIONS includes expected entries", () => {
    expect(COLLECTIONS).toContain("employees");
    expect(COLLECTIONS).toContain("payroll");
    expect(COLLECTIONS).toContain("holidays");
  });
});
