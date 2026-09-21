import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEmployeeReport } from "./useEmployeeReport";

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

describe("useEmployeeReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useEmployeeReport());

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.employees).toEqual([]);
    expect(result.current.groups).toEqual([]);
    expect(result.current.positions).toEqual([]);
    expect(result.current.areas).toEqual([]);
    expect(result.current.statuses).toEqual([]);
    expect(result.current.hasGenerated).toBe(false);
  });

  it("should expose default filters", () => {
    const { result } = renderHook(() => useEmployeeReport());

    expect(result.current.filters).toEqual({
      status: "all",
      groupId: "",
      positionId: "",
      areaId: "",
    });
  });

  it("should expose expandedRows state", () => {
    const { result } = renderHook(() => useEmployeeReport());

    expect(result.current.expandedRows).toBeInstanceOf(Set);
    expect(result.current.expandedRows.size).toBe(0);
  });

  it("should expose action functions", () => {
    const { result } = renderHook(() => useEmployeeReport());

    expect(typeof result.current.generateReport).toBe("function");
    expect(typeof result.current.toggleRow).toBe("function");
    expect(typeof result.current.handleExportXLS).toBe("function");
    expect(typeof result.current.handleExportCSV).toBe("function");
    expect(typeof result.current.handlePrint).toBe("function");
  });

  it("should expose setters", () => {
    const { result } = renderHook(() => useEmployeeReport());

    expect(typeof result.current.setFilters).toBe("function");
  });

  it("should expose canView permission", () => {
    const { result } = renderHook(() => useEmployeeReport());

    expect(typeof result.current.canView).toBe("function");
  });

  it("should toggleRow add and remove from set", () => {
    const { result } = renderHook(() => useEmployeeReport());

    act(() => {
      result.current.toggleRow("emp-1");
    });
    expect(result.current.expandedRows.has("emp-1")).toBe(true);
  });
});

describe("formatCurrency", () => {
  it("should format number to currency string", async () => {
    const { formatCurrency } = await import("./useEmployeeReport");
    expect(formatCurrency(1234.56)).toBe("1,234.56");
    expect(formatCurrency(0)).toBe("0.00");
    expect(formatCurrency(null)).toBe("0.00");
    expect(formatCurrency(undefined)).toBe("0.00");
  });
});

describe("getPrimaryContact", () => {
  it("should return primary contact of given type", async () => {
    const { getPrimaryContact } = await import("./useEmployeeReport");
    const contacts = [
      { type: "phone", value: "123", isPrimary: true },
      { type: "email", value: "test@test.com", isPrimary: false },
    ];
    expect(getPrimaryContact(contacts, "phone")).toBe("123");
    expect(getPrimaryContact(contacts, "email")).toBe("test@test.com");
  });

  it("should return empty string when no contacts", async () => {
    const { getPrimaryContact } = await import("./useEmployeeReport");
    expect(getPrimaryContact(undefined, "phone")).toBe("");
  });
});
