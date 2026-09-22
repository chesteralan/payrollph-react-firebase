import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PayrollRegisterMode } from "./RegisterMode";
import type { ProcessingRow } from "./PayrollOutputView.types";

vi.mock("lucide-react", () => ({
  Columns: () => <svg data-testid="icon-columns" />,
  Filter: () => <svg data-testid="icon-filter" />,
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({ children, onClick, variant, size, className }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    size?: string;
    className?: string;
  }) => (
    <button onClick={onClick} data-variant={variant} data-size={size} className={className}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/Card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h3 data-testid="card-title">{children}</h3>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
}));

const mockRow: ProcessingRow = {
  nameId: "1",
  employeeCode: "EMP001",
  firstName: "John",
  lastName: "Doe",
  groupId: "grp1",
  positionId: "pos1",
  areaId: "area1",
  daysWorked: 20,
  absences: 1,
  lateHours: 2,
  overtimeHours: 5,
  basicSalary: 20000,
  ratePerDay: 1000,
  salaryAmount: 20000,
};

const defaultProps = {
  rows: [mockRow],
  filteredRows: [mockRow],
  earningData: new Map(),
  deductionData: new Map(),
  benefitData: new Map(),
  visibleColumns: {
    basic: true,
    earnings: true,
    gross: true,
    deductions: true,
    benefits: true,
    net: true,
    daysWorked: false,
    absences: false,
    late: false,
    overtime: false,
  },
  setVisibleColumns: vi.fn(),
  showColumns: false,
  setShowColumns: vi.fn(),
  showFilters: false,
  setShowFilters: vi.fn(),
  filterGroup: "",
  setFilterGroup: vi.fn(),
  filterPosition: "",
  setFilterPosition: vi.fn(),
  filterArea: "",
  setFilterArea: vi.fn(),
  groups: ["grp1"],
  positions: ["pos1"],
  areas: ["area1"],
  hasActiveFilters: false,
  activeFilterCount: 0,
  totals: {
    totalBasic: 20000,
    totalEarnings: 0,
    totalGross: 20000,
    totalDeductions: 0,
    totalBenefitsEE: 0,
    totalBenefitsER: 0,
    totalNet: 20000,
  },
  company: { name: "Test Company" },
  payroll: { name: "Payroll Jan", month: 1, year: 2025 },
  monthName: "January",
};

describe("PayrollRegisterMode", () => {
  it("renders the Payroll Register title", () => {
    render(<PayrollRegisterMode {...defaultProps} />);
    expect(screen.getByText("Payroll Register")).toBeTruthy();
  });

  it("renders employee rows", () => {
    render(<PayrollRegisterMode {...defaultProps} />);
    expect(screen.getByText("EMP001")).toBeTruthy();
    expect(screen.getByText(/Doe/)).toBeTruthy();
  });

  it("renders total row when filteredRows has items", () => {
    render(<PayrollRegisterMode {...defaultProps} />);
    expect(screen.getByText(/1 employees/)).toBeTruthy();
  });

  it("shows 'No employees match' when filteredRows is empty", () => {
    render(<PayrollRegisterMode {...defaultProps} filteredRows={[]} />);
    expect(screen.getByText("No employees match the selected filters.")).toBeTruthy();
  });

  it("renders filter button", () => {
    render(<PayrollRegisterMode {...defaultProps} />);
    expect(screen.getByText("Filters")).toBeTruthy();
  });

  it("renders columns button", () => {
    render(<PayrollRegisterMode {...defaultProps} />);
    expect(screen.getByText("Columns")).toBeTruthy();
  });

  it("shows active filter count when filters are active", () => {
    render(
      <PayrollRegisterMode
        {...defaultProps}
        hasActiveFilters={true}
        activeFilterCount={2}
        filteredRows={[mockRow]}
      />,
    );
    expect(screen.getByText("Showing 1 of 1 employees")).toBeTruthy();
  });

  it("shows filter panel when showFilters is true", () => {
    render(<PayrollRegisterMode {...defaultProps} showFilters={true} />);
    expect(screen.getByText("Group")).toBeTruthy();
    expect(screen.getByText("Position")).toBeTruthy();
    expect(screen.getByText("Area")).toBeTruthy();
  });

  it("shows columns panel when showColumns is true", () => {
    render(<PayrollRegisterMode {...defaultProps} showColumns={true} />);
    expect(screen.getByText("Basic Salary")).toBeTruthy();
    expect(screen.getAllByText("Earnings").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Gross Pay")).toBeTruthy();
  });
});
