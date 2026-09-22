import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useEarningsDeductionsReport } from "./useEarningsDeductionsReport";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    currentCompanyId: "test-company-id",
  }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    canView: vi.fn(() => true),
  }),
}));

vi.mock("xlsx", () => ({
  utils: {
    book_new: vi.fn(() => ({})),
    json_to_sheet: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
    decode_range: vi.fn(() => ({ s: { c: 0, r: 0 }, e: { c: 0, r: 0 } })),
    encode_cell: vi.fn(() => "A1"),
  },
  writeFile: vi.fn(),
}));

describe("useEarningsDeductionsReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useEarningsDeductionsReport());

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.hasGenerated).toBe(false);
    expect(result.current.payrollOptions).toEqual([]);
    expect(result.current.selectedPayrolls).toEqual([]);
    expect(result.current.groupFilter).toBe("all");
    expect(result.current.groups).toEqual([]);
    expect(result.current.earningSummaries).toEqual([]);
    expect(result.current.deductionSummaries).toEqual([]);
    expect(result.current.benefitSummaries).toEqual([]);
    expect(result.current.employeeBreakdowns).toEqual([]);
  });

  it("should expose computed totals", () => {
    const { result } = renderHook(() => useEarningsDeductionsReport());

    expect(result.current.totalEarnings).toBe(0);
    expect(result.current.totalDeductions).toBe(0);
    expect(result.current.totalBenefitsEE).toBe(0);
    expect(result.current.totalBenefitsER).toBe(0);
  });

  it("should expose action functions", () => {
    const { result } = renderHook(() => useEarningsDeductionsReport());

    expect(typeof result.current.generateReport).toBe("function");
    expect(typeof result.current.handleExportXLS).toBe("function");
    expect(typeof result.current.handleExportCSV).toBe("function");
  });

  it("should expose setters", () => {
    const { result } = renderHook(() => useEarningsDeductionsReport());

    expect(typeof result.current.setStartMonth).toBe("function");
    expect(typeof result.current.setStartYear).toBe("function");
    expect(typeof result.current.setEndMonth).toBe("function");
    expect(typeof result.current.setEndYear).toBe("function");
    expect(typeof result.current.setSelectedPayrolls).toBe("function");
    expect(typeof result.current.setGroupFilter).toBe("function");
  });

  it("should expose formatCurrency and months", () => {
    const { result } = renderHook(() => useEarningsDeductionsReport());

    expect(typeof result.current.formatCurrency).toBe("function");
    expect(result.current.formatCurrency(1234.56)).toBe("1,234.56");
    expect(Array.isArray(result.current.months)).toBe(true);
    expect(result.current.months).toHaveLength(12);
  });

  it("should expose canView permission", () => {
    const { result } = renderHook(() => useEarningsDeductionsReport());

    expect(typeof result.current.canView).toBe("function");
  });
});
