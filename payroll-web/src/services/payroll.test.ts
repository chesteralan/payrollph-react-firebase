import { describe, it, expect } from "vitest";
import {
  computeGrossPay,
  computeNetPay,
  sumEarnings,
  sumDeductions,
  sumBenefits,
  computeOvertimePay,
  computeHourlyRate,
  computeDailyRate,
} from "./payroll";
import { formatCurrency } from "../utils/currency";

describe("computeGrossPay", () => {
  it("should return salary amount when no earnings", () => {
    expect(computeGrossPay(25000, [])).toBe(25000);
  });

  it("should add earnings to salary", () => {
    expect(computeGrossPay(25000, [1000, 500])).toBe(26500);
  });

  it("should handle zero salary", () => {
    expect(computeGrossPay(0, [1000])).toBe(1000);
  });

  it("should handle negative earnings (deductions from gross)", () => {
    expect(computeGrossPay(25000, [-500])).toBe(24500);
  });
});

describe("computeNetPay", () => {
  it("should subtract deductions and benefits from gross", () => {
    expect(computeNetPay(30000, [2000, 1000], [500])).toBe(26500);
  });

  it("should return gross when no deductions or benefits", () => {
    expect(computeNetPay(25000, [], [])).toBe(25000);
  });

  it("should handle zero gross", () => {
    expect(computeNetPay(0, [1000], [500])).toBe(-1500);
  });

  it("should handle large deduction sets", () => {
    const deductions = Array.from({ length: 20 }, (_, i) => i * 100);
    const benefits = [1000, 500];
    expect(computeNetPay(100000, deductions, benefits)).toBe(
      100000 - deductions.reduce((s, v) => s + v, 0) - 1500,
    );
  });
});

describe("sumEarnings", () => {
  it("should sum all values in a map", () => {
    const map = new Map([
      ["overtime", 1500],
      ["bonus", 2000],
    ]);
    expect(sumEarnings(map)).toBe(3500);
  });

  it("should return 0 for empty map", () => {
    expect(sumEarnings(new Map())).toBe(0);
  });
});

describe("sumDeductions", () => {
  it("should sum all deduction values", () => {
    const map = new Map([
      ["tax", 5000],
      ["sss", 1200],
    ]);
    expect(sumDeductions(map)).toBe(6200);
  });

  it("should return 0 for empty map", () => {
    expect(sumDeductions(new Map())).toBe(0);
  });
});

describe("sumBenefits", () => {
  it("should sum employeeShare from benefit entries", () => {
    const map = new Map([
      ["philhealth", { employeeShare: 500, employerShare: 500 }],
      ["pagibig", { employeeShare: 200, employerShare: 200 }],
    ]);
    expect(sumBenefits(map)).toBe(700);
  });

  it("should return 0 for empty map", () => {
    expect(sumBenefits(new Map())).toBe(0);
  });
});

describe("formatCurrency", () => {
  it("should format value as PHP currency", () => {
    const result = formatCurrency(25000.5);
    expect(result).toContain("25,000.50");
    expect(result).toContain("₱");
  });

  it("should format zero", () => {
    expect(formatCurrency(0)).toContain("0.00");
  });

  it("should format negative values", () => {
    expect(formatCurrency(-500)).toContain("-");
  });
});

describe("computeOvertimePay", () => {
  it("should calculate overtime at 1.5x by default", () => {
    expect(computeOvertimePay(100, 10)).toBe(1500);
  });

  it("should use custom multiplier when provided", () => {
    expect(computeOvertimePay(100, 10, 2)).toBe(2000);
  });

  it("should return 0 when no overtime hours", () => {
    expect(computeOvertimePay(100, 0)).toBe(0);
  });

  it("should handle fractional hours", () => {
    expect(computeOvertimePay(100, 2.5)).toBe(375);
  });
});

describe("computeHourlyRate", () => {
  it("should compute hourly rate from monthly salary", () => {
    expect(computeHourlyRate(22000)).toBe(125);
  });

  it("should use custom work days and hours", () => {
    expect(computeHourlyRate(24000, 20, 8)).toBe(150);
  });

  it("should return 0 for zero salary", () => {
    expect(computeHourlyRate(0)).toBe(0);
  });
});

describe("computeDailyRate", () => {
  it("should compute daily rate from monthly salary", () => {
    expect(computeDailyRate(22000)).toBe(1000);
  });

  it("should use custom work days per month", () => {
    expect(computeDailyRate(30000, 20)).toBe(1500);
  });

  it("should return 0 for zero salary", () => {
    expect(computeDailyRate(0)).toBe(0);
  });
});
