import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmployeeSelector } from "./EmployeeSelector";
import type { DTRPageViewMode } from "./DTRPage.types";

const employees = [
  { id: "1", name: "John Doe", employeeCode: "EMP001" },
  { id: "2", name: "Jane Smith", employeeCode: "EMP002" },
];

const defaultProps = {
  employees,
  selectedEmployeeId: "1",
  onEmployeeChange: vi.fn(),
  selectedMonth: 0,
  selectedYear: 2025,
  onPrevMonth: vi.fn(),
  onNextMonth: vi.fn(),
  onYearChange: vi.fn(),
  viewMode: "calendar" as DTRPageViewMode,
  onViewModeChange: vi.fn(),
};

function setup(props?: Partial<typeof defaultProps>) {
  const merged = { ...defaultProps, ...props };
  merged.onEmployeeChange = vi.fn();
  merged.onPrevMonth = vi.fn();
  merged.onNextMonth = vi.fn();
  merged.onYearChange = vi.fn();
  merged.onViewModeChange = vi.fn();
  render(<EmployeeSelector {...merged} />);
  return merged;
}

describe("EmployeeSelector", () => {
  it("renders the default 'Select Employee' option", () => {
    setup();
    expect(screen.getByText("Select Employee")).toBeInTheDocument();
  });

  it("renders employee options", () => {
    setup();
    expect(screen.getByText("John Doe (EMP001)")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith (EMP002)")).toBeInTheDocument();
  });

  it("displays the current month and year", () => {
    setup({ selectedMonth: 4, selectedYear: 2025 });
    expect(screen.getByText("May 2025")).toBeInTheDocument();
  });

  it("calls onEmployeeChange when employee is selected", () => {
    const merged = setup();
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "2" } });
    expect(merged.onEmployeeChange).toHaveBeenCalledWith("2");
  });

  it("calls onPrevMonth when prev button is clicked", () => {
    const merged = setup();
    const buttons = screen.getAllByRole("button");
    const prevButton = buttons.find((b) =>
      b.querySelector("[data-testid*='chevronleft']"),
    );
    expect(prevButton).toBeTruthy();
    fireEvent.click(prevButton!);
    expect(merged.onPrevMonth).toHaveBeenCalledTimes(1);
  });

  it("calls onNextMonth when next button is clicked", () => {
    const merged = setup();
    const buttons = screen.getAllByRole("button");
    const nextButton = buttons.find((b) =>
      b.querySelector("[data-testid*='chevronright']"),
    );
    expect(nextButton).toBeTruthy();
    fireEvent.click(nextButton!);
    expect(merged.onNextMonth).toHaveBeenCalledTimes(1);
  });

  it("calls onYearChange when year is changed", () => {
    const merged = setup();
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1], { target: { value: "2024" } });
    expect(merged.onYearChange).toHaveBeenCalledWith(2024);
  });

  it("calls onViewModeChange('summary') when Summary button is clicked", () => {
    const merged = setup();
    fireEvent.click(screen.getByText("Summary"));
    expect(merged.onViewModeChange).toHaveBeenCalledWith("summary");
  });

  it("calls onViewModeChange('calendar') when Calendar button is clicked", () => {
    const merged = setup({ viewMode: "summary" });
    fireEvent.click(screen.getByText("Calendar"));
    expect(merged.onViewModeChange).toHaveBeenCalledWith("calendar");
  });

  it("highlights the active view mode", () => {
    setup({ viewMode: "summary" });
    const summaryBtn = screen.getByText("Summary").closest("button");
    expect(summaryBtn?.className).toContain("bg-primary-600");
  });
});
