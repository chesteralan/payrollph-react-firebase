import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCalendarPage } from "./useCalendarPage";

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

describe("useCalendarPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useCalendarPage());

    expect(result.current).toBeDefined();
    expect(result.current.events).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.showForm).toBe(false);
    expect(result.current.showRecurringForm).toBe(false);
    expect(result.current.editingId).toBeNull();
    expect(result.current.selectedYear).toBe(new Date().getFullYear());
  });

  it("should expose default form data", () => {
    const { result } = renderHook(() => useCalendarPage());

    expect(result.current.formData).toEqual({
      date: "",
      name: "",
      type: "holiday",
      isPaid: true,
    });
  });

  it("should expose default recurring form data", () => {
    const { result } = renderHook(() => useCalendarPage());

    expect(result.current.recurringFormData).toEqual({
      month: 1,
      day: 1,
      name: "",
      type: "holiday",
      isPaid: true,
      years: 5,
    });
  });

  it("should expose groupedByMonth", () => {
    const { result } = renderHook(() => useCalendarPage());

    expect(result.current.groupedByMonth).toBeDefined();
    expect(typeof result.current.groupedByMonth).toBe("object");
  });

  it("should expose action functions", () => {
    const { result } = renderHook(() => useCalendarPage());

    expect(typeof result.current.fetchEvents).toBe("function");
    expect(typeof result.current.handleSubmit).toBe("function");
    expect(typeof result.current.handleEdit).toBe("function");
    expect(typeof result.current.handleDelete).toBe("function");
    expect(typeof result.current.handleExport).toBe("function");
    expect(typeof result.current.handleCreateRecurringHoliday).toBe("function");
  });

  it("should expose setters", () => {
    const { result } = renderHook(() => useCalendarPage());

    expect(typeof result.current.setShowForm).toBe("function");
    expect(typeof result.current.setShowRecurringForm).toBe("function");
    expect(typeof result.current.setFormData).toBe("function");
    expect(typeof result.current.setRecurringFormData).toBe("function");
    expect(typeof result.current.setSelectedYear).toBe("function");
    expect(typeof result.current.setEditingId).toBe("function");
  });
});
