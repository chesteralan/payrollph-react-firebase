import { describe, it, expect } from "vitest";
import {
  WIZARD_STEPS,
  OUTPUT_TYPES,
  PAPER_SIZES,
  FONT_SIZES,
  AVAILABLE_COLUMNS,
  DEFAULT_COLUMNS,
  DEFAULT_SIGNATURE_LABELS,
} from "./PrintFormatsPage.constants";

describe("PrintFormatsPage constants", () => {
  it("WIZARD_STEPS has 5 steps", () => {
    expect(WIZARD_STEPS).toHaveLength(5);
    expect(WIZARD_STEPS[0]).toBe("Basic Info");
    expect(WIZARD_STEPS[4]).toBe("Review");
  });

  it("OUTPUT_TYPES has value/label pairs", () => {
    expect(OUTPUT_TYPES.length).toBeGreaterThan(0);
    for (const item of OUTPUT_TYPES) {
      expect(typeof item.value).toBe("string");
      expect(typeof item.label).toBe("string");
    }
  });

  it("PAPER_SIZES contains A4, Letter, Legal", () => {
    expect(PAPER_SIZES).toEqual(["A4", "Letter", "Legal"]);
  });

  it("FONT_SIZES has value/label pairs", () => {
    expect(FONT_SIZES.length).toBeGreaterThan(0);
    for (const item of FONT_SIZES) {
      expect(typeof item.value).toBe("string");
      expect(typeof item.label).toBe("string");
    }
  });

  it("AVAILABLE_COLUMNS has id/label pairs", () => {
    expect(AVAILABLE_COLUMNS.length).toBeGreaterThan(0);
    for (const col of AVAILABLE_COLUMNS) {
      expect(typeof col.id).toBe("string");
      expect(typeof col.label).toBe("string");
    }
  });

  it("DEFAULT_COLUMNS is a non-empty array", () => {
    expect(DEFAULT_COLUMNS.length).toBeGreaterThan(0);
    expect(Array.isArray(DEFAULT_COLUMNS)).toBe(true);
  });

  it("DEFAULT_SIGNATURE_LABELS is a non-empty array", () => {
    expect(DEFAULT_SIGNATURE_LABELS.length).toBeGreaterThan(0);
    expect(DEFAULT_SIGNATURE_LABELS).toContain("Prepared by");
  });
});
