import { describe, it, expect } from "vitest";
import * as exports from "./ListPages";

describe("ListPages barrel export", () => {
  it("exports BenefitsPage", () => {
    expect(exports.BenefitsPage).toBeDefined();
  });

  it("exports EarningsPage", () => {
    expect(exports.EarningsPage).toBeDefined();
  });

  it("exports DeductionsPage", () => {
    expect(exports.DeductionsPage).toBeDefined();
  });
});
