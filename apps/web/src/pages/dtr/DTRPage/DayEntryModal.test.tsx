import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DayEntryModal } from "./DayEntryModal";
import type { DTRPageDayForm } from "./DTRPage.types";

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

const defaultForm: DTRPageDayForm = {
  timeIn: "",
  timeOut: "",
  overtimeHours: 0,
  lateHours: 0,
  absenceType: undefined,
  absenceReason: "",
  notes: "",
};

const defaultProps = {
  show: true,
  selectedDay: 15,
  selectedMonth: 0,
  selectedYear: 2025,
  dayForm: defaultForm,
  hasExistingEntry: false,
  canDelete: false,
  hoursWorked: 8,
  onClose: vi.fn(),
  onChange: vi.fn(),
  onSave: vi.fn(),
  onDelete: vi.fn(),
};

function setup(props?: Partial<typeof defaultProps>) {
  const merged = { ...defaultProps, ...props };
  merged.onClose = vi.fn();
  merged.onChange = vi.fn();
  merged.onSave = vi.fn();
  merged.onDelete = vi.fn();
  render(<DayEntryModal {...merged} />);
  return merged;
}

describe("DayEntryModal", () => {
  it("does not render when show is false", () => {
    setup({ show: false });
    expect(screen.queryByText("January 15, 2025")).not.toBeInTheDocument();
  });

  it("does not render when selectedDay is null", () => {
    setup({ selectedDay: null });
    expect(screen.queryByText("January 15, 2025")).not.toBeInTheDocument();
  });

  it("renders the date header", () => {
    setup();
    expect(screen.getByText("January 15, 2025")).toBeInTheDocument();
  });

  it("renders Time In and Time Out inputs", () => {
    setup();
    expect(screen.getByLabelText("Time In")).toBeInTheDocument();
    expect(screen.getByLabelText("Time Out")).toBeInTheDocument();
  });

  it("renders Late Hours and Overtime Hours inputs", () => {
    setup();
    expect(screen.getByLabelText("Late Hours")).toBeInTheDocument();
    expect(screen.getByLabelText("Overtime Hours")).toBeInTheDocument();
  });

  it("renders Notes input", () => {
    setup();
    expect(screen.getByLabelText("Notes")).toBeInTheDocument();
  });

  it("renders Absence Type select with options", () => {
    setup();
    expect(screen.getByText("None")).toBeInTheDocument();
    expect(screen.getByText("Absent")).toBeInTheDocument();
    expect(screen.getByText("Sick Leave")).toBeInTheDocument();
  });

  it("shows Absence Reason input when absenceType is selected", () => {
    setup({ dayForm: { ...defaultForm, absenceType: "sick" } });
    expect(screen.getByLabelText("Absence Reason")).toBeInTheDocument();
  });

  it("hides Absence Reason input when no absenceType", () => {
    setup({ dayForm: defaultForm });
    expect(screen.queryByLabelText("Absence Reason")).not.toBeInTheDocument();
  });

  it("shows Hours Worked when both timeIn and timeOut are set", () => {
    setup({
      dayForm: { ...defaultForm, timeIn: "09:00", timeOut: "17:00" },
      hoursWorked: 8,
    });
    expect(screen.getByText("Hours Worked:")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("hides Hours Worked when timeOut is empty", () => {
    setup({ dayForm: { ...defaultForm, timeIn: "09:00", timeOut: "" } });
    expect(screen.queryByText("Hours Worked:")).not.toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", () => {
    const merged = setup();
    fireEvent.click(screen.getByText("Cancel"));
    expect(merged.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onSave when Save is clicked", () => {
    const merged = setup();
    fireEvent.click(screen.getByText("Save"));
    expect(merged.onSave).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    const merged = setup();
    const backdrop = document.querySelector(".fixed.inset-0.bg-black\\/50");
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);
    expect(merged.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onChange when Time In is changed", () => {
    const merged = setup();
    fireEvent.change(screen.getByLabelText("Time In"), {
      target: { value: "08:00" },
    });
    expect(merged.onChange).toHaveBeenCalled();
  });

  it("shows Delete button when canDelete and hasExistingEntry are true", () => {
    setup({ canDelete: true, hasExistingEntry: true });
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("hides Delete button when canDelete is false", () => {
    setup({ canDelete: false, hasExistingEntry: true });
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("hides Delete button when hasExistingEntry is false", () => {
    setup({ canDelete: true, hasExistingEntry: false });
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });
});
