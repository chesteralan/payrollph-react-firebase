import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCustomReportBuilder } from "./useCustomReportBuilder";

vi.mock("@/hooks/useCompany", () => ({
  useCompany: () => ({
    selectedCompany: { id: "test-company", name: "Test Company" },
    companies: [],
    loading: false,
    selectCompany: vi.fn(),
  }),
}));

vi.mock("@/utils/exportUtils", () => ({
  exportToXLS: vi.fn(),
}));

vi.mock("./CustomReportBuilderPage.constants", () => ({
  AVAILABLE_FIELDS: [
    { id: "emp_name", label: "Employee Name" },
    { id: "emp_code", label: "Employee Code" },
    { id: "basic_salary", label: "Basic Salary" },
    { id: "gross_pay", label: "Gross Pay" },
    { id: "net_pay", label: "Net Pay" },
  ],
}));

describe("useCustomReportBuilder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useCustomReportBuilder());

    expect(result.current).toBeDefined();
    expect(result.current.reportName).toBe("");
    expect(result.current.selectedFields).toEqual([
      "emp_name", "emp_code", "basic_salary", "gross_pay", "net_pay",
    ]);
    expect(result.current.filters).toEqual([]);
    expect(result.current.groupBy).toBe("");
    expect(result.current.sortBy).toBe("emp_name");
    expect(result.current.sortDirection).toBe("asc");
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.previewData).toEqual([]);
    expect(result.current.savedReports).toEqual([]);
    expect(result.current.activeTab).toBe("builder");
  });

  it("should expose field toggle function", () => {
    const { result } = renderHook(() => useCustomReportBuilder());

    expect(typeof result.current.toggleField).toBe("function");
  });

  it("should expose filter functions", () => {
    const { result } = renderHook(() => useCustomReportBuilder());

    expect(typeof result.current.addFilter).toBe("function");
    expect(typeof result.current.updateFilter).toBe("function");
    expect(typeof result.current.removeFilter).toBe("function");
  });

  it("should expose report actions", () => {
    const { result } = renderHook(() => useCustomReportBuilder());

    expect(typeof result.current.generateReport).toBe("function");
    expect(typeof result.current.exportReport).toBe("function");
    expect(typeof result.current.saveReport).toBe("function");
    expect(typeof result.current.loadReport).toBe("function");
  });

  it("should expose setters", () => {
    const { result } = renderHook(() => useCustomReportBuilder());

    expect(typeof result.current.setReportName).toBe("function");
    expect(typeof result.current.setGroupBy).toBe("function");
    expect(typeof result.current.setSortBy).toBe("function");
    expect(typeof result.current.setSortDirection).toBe("function");
    expect(typeof result.current.setActiveTab).toBe("function");
  });

  it("should expose constants and company ID", () => {
    const { result } = renderHook(() => useCustomReportBuilder());

    expect(result.current.AVAILABLE_FIELDS).toBeDefined();
    expect(Array.isArray(result.current.AVAILABLE_FIELDS)).toBe(true);
    expect(result.current.currentCompanyId).toBe("test-company");
  });
});
