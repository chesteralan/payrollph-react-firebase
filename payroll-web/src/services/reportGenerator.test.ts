import { describe, it, expect } from "vitest";
import { generateReportData } from "./reportGenerator";

describe("reportGenerator", () => {
  it("should return an empty array for any report type", async () => {
    const result = await generateReportData("payroll-summary");
    expect(result).toEqual([]);
  });

  it("should return an empty array with filters", async () => {
    const result = await generateReportData(
      "attendance",
      { companyId: "comp1", from: "2024-01-01", to: "2024-01-31" },
    );
    expect(result).toEqual([]);
  });

  it("should return an empty array with fields specified", async () => {
    const result = await generateReportData(
      "employee-list",
      undefined,
      ["name", "department", "position"],
    );
    expect(result).toEqual([]);
  });

  it("should return an empty array with all parameters", async () => {
    const result = await generateReportData(
      "13th-month",
      { year: 2024 },
      ["employee", "grossPay", "monthsPay"],
    );
    expect(result).toEqual([]);
  });

  it("should handle empty report type string", async () => {
    const result = await generateReportData("");
    expect(result).toEqual([]);
  });

  it("should return a new array each call (immutable)", async () => {
    const result1 = await generateReportData("payroll-summary");
    const result2 = await generateReportData("payroll-summary");
    expect(result1).toEqual([]);
    expect(result2).toEqual([]);
    // Different references
    expect(Object.is(result1, result2)).toBe(false);
  });
});
