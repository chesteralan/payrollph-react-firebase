import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePayrollDetail } from "./usePayrollDetail";

vi.mock("react-router-dom", () => ({
  useParams: () => ({ id: "test-payroll-id" }),
  useNavigate: () => vi.fn(),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

vi.mock("@/utils/currency", () => ({
  formatCurrency: vi.fn((v: number) => `₱${v.toFixed(2)}`),
}));

vi.mock("@/utils/calendarUtils", () => ({
  calculateWorkingDaysSync: vi.fn(() => ({ totalWorkingDays: 22 })),
}));

describe("usePayrollDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => usePayrollDetail());

    expect(result.current).toBeDefined();
    expect(result.current.payroll).toBeNull();
    expect(result.current.activeStage).toBe("dtr");
    expect(result.current.loading).toBe(true);
    expect(result.current.rows).toEqual([]);
    expect(result.current.earningsList).toEqual([]);
    expect(result.current.deductionsList).toEqual([]);
    expect(result.current.benefitsList).toEqual([]);
    expect(result.current.saving).toBe(false);
    expect(result.current.showValidation).toBe(false);
    expect(result.current.validationErrors).toEqual([]);
  });

  it("should expose STAGES constant", () => {
    const { result } = renderHook(() => usePayrollDetail());

    expect(result.current.STAGES).toEqual([
      "dtr",
      "salaries",
      "earnings",
      "benefits",
      "deductions",
      "summary",
      "output",
    ]);
  });

  it("should expose stage navigation", () => {
    const { result } = renderHook(() => usePayrollDetail());

    expect(typeof result.current.setActiveStage).toBe("function");
  });

  it("should expose lock/publish/save functions", () => {
    const { result } = renderHook(() => usePayrollDetail());

    expect(typeof result.current.toggleLock).toBe("function");
    expect(typeof result.current.handlePublish).toBe("function");
    expect(typeof result.current.handleSaveStage).toBe("function");
  });

  it("should expose data update functions", () => {
    const { result } = renderHook(() => usePayrollDetail());

    expect(typeof result.current.updateRow).toBe("function");
    expect(typeof result.current.updateEarning).toBe("function");
    expect(typeof result.current.updateDeduction).toBe("function");
    expect(typeof result.current.updateBenefit).toBe("function");
  });

  it("should expose calculation functions", () => {
    const { result } = renderHook(() => usePayrollDetail());

    expect(typeof result.current.getEarningTotal).toBe("function");
    expect(typeof result.current.getDeductionTotal).toBe("function");
    expect(typeof result.current.getEmployeeGross).toBe("function");
    expect(typeof result.current.getEmployeeNet).toBe("function");
  });

  it("should expose validation state", () => {
    const { result } = renderHook(() => usePayrollDetail());

    expect(typeof result.current.setShowValidation).toBe("function");
  });

  it("should expose navigate", () => {
    const { result } = renderHook(() => usePayrollDetail());

    expect(typeof result.current.navigate).toBe("function");
  });
});
