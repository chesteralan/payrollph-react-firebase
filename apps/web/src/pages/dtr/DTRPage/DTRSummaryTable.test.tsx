import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DTRSummaryTable } from "./DTRSummaryTable";
import type { DTREntry } from "@/types/dtr";

vi.mock("@/components/ui/SearchBar", () => ({
  SearchBar: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <input
      data-testid="search-bar"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
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

const baseEntry: DTREntry = {
  id: "1",
  employeeId: "emp1",
  date: "2025-01-15",
  timeIn: "09:00",
  timeOut: "17:00",
  hoursWorked: 8,
  overtimeHours: 2,
  lateHours: 0.5,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeEntries(
  overrides?: Partial<DTREntry>[],
): (DTREntry & { employeeName?: string; employeeCode?: string })[] {
  return (overrides || [{}]).map((o, i) => ({
    ...baseEntry,
    id: String(i + 1),
    employeeName: "John Doe",
    employeeCode: "EMP001",
    ...o,
  }));
}

describe("DTRSummaryTable", () => {
  it("renders the title with month and year", () => {
    render(
      <DTRSummaryTable
        entries={[]}
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedMonth={0}
        selectedYear={2025}
      />,
    );
    expect(screen.getByText("DTR Summary - January 2025")).toBeInTheDocument();
  });

  it("renders 'No entries' when entries is empty", () => {
    render(
      <DTRSummaryTable
        entries={[]}
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedMonth={0}
        selectedYear={2025}
      />,
    );
    expect(screen.getByText("No entries for this period")).toBeInTheDocument();
  });

  it("renders entry count as singular", () => {
    render(
      <DTRSummaryTable
        entries={makeEntries([{}])}
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedMonth={0}
        selectedYear={2025}
      />,
    );
    expect(screen.getByText("1 entry")).toBeInTheDocument();
  });

  it("renders entry count as plural", () => {
    render(
      <DTRSummaryTable
        entries={makeEntries([{}, {}])}
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedMonth={0}
        selectedYear={2025}
      />,
    );
    expect(screen.getByText("2 entries")).toBeInTheDocument();
  });

  it("renders employee data in table rows", () => {
    render(
      <DTRSummaryTable
        entries={makeEntries([{ employeeName: "Jane Smith", employeeCode: "EMP002" }])}
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedMonth={0}
        selectedYear={2025}
      />,
    );
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("EMP002")).toBeInTheDocument();
  });

  it("shows Present status when timeIn and timeOut exist", () => {
    render(
      <DTRSummaryTable
        entries={makeEntries([{}])}
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedMonth={0}
        selectedYear={2025}
      />,
    );
    expect(screen.getByText("Present")).toBeInTheDocument();
  });

  it("shows absence type badge when absenceType is set", () => {
    render(
      <DTRSummaryTable
        entries={makeEntries([{ absenceType: "sick" }])}
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedMonth={0}
        selectedYear={2025}
      />,
    );
    expect(screen.getByText("sick")).toBeInTheDocument();
  });

  it("shows Incomplete status when only timeIn is set", () => {
    render(
      <DTRSummaryTable
        entries={makeEntries([{ timeOut: undefined }])}
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedMonth={0}
        selectedYear={2025}
      />,
    );
    expect(screen.getByText("Incomplete")).toBeInTheDocument();
  });

  it("displays hours worked, overtime, and late values", () => {
    render(
      <DTRSummaryTable
        entries={makeEntries([{ hoursWorked: 8, overtimeHours: 2, lateHours: 0.5 }])}
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedMonth={0}
        selectedYear={2025}
      />,
    );
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("0.5")).toBeInTheDocument();
  });

  it("renders the search bar with correct props", () => {
    render(
      <DTRSummaryTable
        entries={[]}
        searchQuery="test"
        onSearchChange={vi.fn()}
        selectedMonth={0}
        selectedYear={2025}
      />,
    );
    const searchInput = screen.getByTestId("search-bar");
    expect(searchInput).toHaveValue("test");
  });
});
