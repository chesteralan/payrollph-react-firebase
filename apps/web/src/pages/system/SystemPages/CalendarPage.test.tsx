import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { CalendarPage } from "./CalendarPage";
import { renderWithProviders } from "@/test/page-test-utils";
import { usePermissions } from "@/hooks/usePermissions";

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: vi.fn(),
}));

const mockUsePermissions = vi.mocked(usePermissions);

vi.mock("./useCalendarPage", () => ({
  useCalendarPage: () => ({
    loading: false,
    showForm: false,
    showRecurringForm: false,
    selectedYear: 2025,
    formData: { date: "", name: "", type: "holiday", isPaid: true },
    recurringFormData: {
      month: 0,
      day: 1,
      name: "",
      type: "holiday",
      isPaid: true,
    },
    groupedByMonth: {},
    setShowForm: vi.fn(),
    setShowRecurringForm: vi.fn(),
    setFormData: vi.fn(),
    setRecurringFormData: vi.fn(),
    setSelectedYear: vi.fn(),
    editingId: null,
    setEditingId: vi.fn(),
    handleSubmit: vi.fn(),
    handleEdit: vi.fn(),
    handleDelete: vi.fn(),
    handleExport: vi.fn(),
    handleCreateRecurringHoliday: vi.fn(),
  }),
}));

vi.mock("@/utils/calendarUtils", () => ({
  MONTH_NAMES: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
}));

describe("CalendarPage", () => {
  beforeEach(() => {
    mockUsePermissions.mockReturnValue({
      canView: () => true,
      canAdd: () => true,
      canEdit: () => true,
      canDelete: () => true,
    } as ReturnType<typeof usePermissions>);
  });

  it("renders the page title", () => {
    renderWithProviders(<CalendarPage />);
    expect(screen.getByText("System Calendar")).toBeInTheDocument();
  });

  it("renders Export CSV button", () => {
    renderWithProviders(<CalendarPage />);
    expect(screen.getByText("Export CSV")).toBeInTheDocument();
  });

  it("renders Add Date button", () => {
    renderWithProviders(<CalendarPage />);
    expect(screen.getByText("Add Date")).toBeInTheDocument();
  });

  it("renders Recurring Holiday button", () => {
    renderWithProviders(<CalendarPage />);
    expect(screen.getByText("Recurring Holiday")).toBeInTheDocument();
  });

  it("shows empty state when no entries", () => {
    renderWithProviders(<CalendarPage />);
    expect(
      screen.getByText("No calendar entries for 2025"),
    ).toBeInTheDocument();
  });

  it("renders year selector", () => {
    renderWithProviders(<CalendarPage />);
    expect(screen.getByDisplayValue("2025")).toBeInTheDocument();
  });

  it("shows access denied when canView returns false", () => {
    mockUsePermissions.mockReturnValue({
      canView: () => false,
      canAdd: () => false,
      canEdit: () => false,
      canDelete: () => false,
    } as ReturnType<typeof usePermissions>);
    renderWithProviders(<CalendarPage />);
    expect(screen.getByText("Access denied")).toBeInTheDocument();
  });
});
