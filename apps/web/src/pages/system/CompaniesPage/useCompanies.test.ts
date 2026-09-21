import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCompanies } from "./useCompanies";

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    canView: vi.fn(() => true),
    canAdd: vi.fn(() => true),
    canEdit: vi.fn(() => true),
    canDelete: vi.fn(() => true),
  }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

vi.mock("@/hooks/useTableSort", () => ({
  useTableSort: (items: unknown[], defaultSort?: string) => ({
    items,
    sortConfig: defaultSort ? { key: defaultSort, direction: "asc" } : null,
    filterText: "",
    setFilterText: vi.fn(),
    handleSort: vi.fn(),
  }),
}));

describe("useCompanies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useCompanies());

    expect(result.current).toBeDefined();
    expect(result.current.companies).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.showForm).toBe(false);
    expect(result.current.editingId).toBeNull();
    expect(result.current.showDeleted).toBe(false);
    expect(result.current.searchQuery).toBe("");
  });

  it("should expose default form data", () => {
    const { result } = renderHook(() => useCompanies());

    expect(result.current.formData).toEqual({
      name: "",
      address: "",
      tin: "",
      printHeader: "",
      printFooter: "",
      printCss: "",
      defaultWorkdays: 22,
      currency: "PHP",
      payrollPeriods: [],
    });
  });

  it("should expose default column group", () => {
    const { result } = renderHook(() => useCompanies());

    expect(result.current.columnGroup).toEqual({
      dtr: true,
      salaries: true,
      earnings: true,
      benefits: true,
      deductions: true,
    });
  });

  it("should expose action functions", () => {
    const { result } = renderHook(() => useCompanies());

    expect(typeof result.current.fetchCompanies).toBe("function");
    expect(typeof result.current.handleSubmit).toBe("function");
    expect(typeof result.current.handleEdit).toBe("function");
    expect(typeof result.current.handleToggleStatus).toBe("function");
    expect(typeof result.current.handleSoftDelete).toBe("function");
    expect(typeof result.current.handleRestore).toBe("function");
    expect(typeof result.current.handlePermanentDelete).toBe("function");
  });

  it("should expose payroll period functions", () => {
    const { result } = renderHook(() => useCompanies());

    expect(typeof result.current.addPayrollPeriod).toBe("function");
    expect(typeof result.current.removePayrollPeriod).toBe("function");
    expect(typeof result.current.updatePayrollPeriod).toBe("function");
  });

  it("should expose setters", () => {
    const { result } = renderHook(() => useCompanies());

    expect(typeof result.current.setShowForm).toBe("function");
    expect(typeof result.current.setEditingId).toBe("function");
    expect(typeof result.current.setShowDeleted).toBe("function");
    expect(typeof result.current.setSearchQuery).toBe("function");
    expect(typeof result.current.setFormData).toBe("function");
    expect(typeof result.current.setColumnGroup).toBe("function");
  });

  it("should expose permissions", () => {
    const { result } = renderHook(() => useCompanies());

    expect(typeof result.current.canView).toBe("function");
    expect(typeof result.current.canAdd).toBe("function");
    expect(typeof result.current.canEdit).toBe("function");
    expect(typeof result.current.canDelete).toBe("function");
  });

  it("should expose sorting", () => {
    const { result } = renderHook(() => useCompanies());

    expect(result.current.sortedCompanies).toBeDefined();
    expect(typeof result.current.handleSort).toBe("function");
    expect(result.current.sortConfig).toBeDefined();
  });
});
