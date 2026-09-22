import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDTRPage } from "./useDTRPage";

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    canView: vi.fn(() => true),
    canEdit: vi.fn(() => true),
    canDelete: vi.fn(() => true),
  }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

vi.mock("@/pages/dtr/DTRPage/DTRComputation", () => ({
  calcHours: vi.fn(() => 8),
  dateStr: vi.fn(() => "2026-01-01"),
  daysInMonth: vi.fn(() => 31),
  firstDayOfMonth: vi.fn(() => 0),
  useDTRStats: vi.fn(() => ({
    totalDaysWorked: 0,
    totalHoursWorked: 0,
    totalOvertime: 0,
    totalLate: 0,
    totalAbsences: 0,
  })),
}));

vi.mock("@/utils/calendarUtils", () => ({
  MONTH_NAMES: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
}));

describe("useDTRPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useDTRPage());

    expect(result.current).toBeDefined();
    expect(result.current.employees).toEqual([]);
    expect(result.current.selectedMonth).toBeDefined();
    expect(result.current.selectedYear).toBeDefined();
    expect(result.current.dtrEntries).toEqual([]);
    expect(result.current.leaveBalances).toEqual([]);
    expect(result.current.leaveApplications).toEqual([]);
    expect(result.current.showDayModal).toBe(false);
    expect(result.current.showLeaveModal).toBe(false);
    expect(result.current.viewMode).toBe("calendar");
    expect(result.current.dtrSearchQuery).toBe("");
  });

  it("should expose navigation functions", () => {
    const { result } = renderHook(() => useDTRPage());

    expect(typeof result.current.handlePrevMonth).toBe("function");
    expect(typeof result.current.handleNextMonth).toBe("function");
  });

  it("should expose CRUD functions", () => {
    const { result } = renderHook(() => useDTRPage());

    expect(typeof result.current.openDayModal).toBe("function");
    expect(typeof result.current.saveDayEntry).toBe("function");
    expect(typeof result.current.deleteDayEntry).toBe("function");
  });

  it("should expose leave functions", () => {
    const { result } = renderHook(() => useDTRPage());

    expect(typeof result.current.applyLeave).toBe("function");
    expect(typeof result.current.approveLeave).toBe("function");
    expect(typeof result.current.rejectLeave).toBe("function");
  });

  it("should expose export/import functions", () => {
    const { result } = renderHook(() => useDTRPage());

    expect(typeof result.current.handleExport).toBe("function");
    expect(typeof result.current.handleFileSelect).toBe("function");
    expect(typeof result.current.handleImport).toBe("function");
  });

  it("should expose setters", () => {
    const { result } = renderHook(() => useDTRPage());

    expect(typeof result.current.setSelectedEmployeeId).toBe("function");
    expect(typeof result.current.setSelectedMonth).toBe("function");
    expect(typeof result.current.setSelectedYear).toBe("function");
    expect(typeof result.current.setShowDayModal).toBe("function");
    expect(typeof result.current.setShowLeaveModal).toBe("function");
    expect(typeof result.current.setViewMode).toBe("function");
    expect(typeof result.current.setDtrSearchQuery).toBe("function");
    expect(typeof result.current.setDayForm).toBe("function");
    expect(typeof result.current.setLeaveForm).toBe("function");
  });

  it("should expose derived data", () => {
    const { result } = renderHook(() => useDTRPage());

    expect(result.current.filteredMonthEntries).toBeDefined();
    expect(result.current.entryMap).toBeDefined();
    expect(result.current.stats).toBeDefined();
    expect(result.current.today).toBeInstanceOf(Date);
    expect(typeof result.current.dim).toBe("number");
    expect(typeof result.current.fdm).toBe("number");
  });

  it("should expose permission checks", () => {
    const { result } = renderHook(() => useDTRPage());

    expect(typeof result.current.canView).toBe("function");
    expect(typeof result.current.canEdit).toBe("function");
    expect(typeof result.current.canDelete).toBe("function");
  });
});
