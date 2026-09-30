import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PayslipMode } from "./PayslipMode";
import type { ProcessingRow } from "./PayrollOutputView.types";

vi.mock("lucide-react", () => ({
  Printer: () => <svg data-testid="icon-printer" />,
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({
    children,
    onClick,
    variant,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    className?: string;
  }) => (
    <button onClick={onClick} data-variant={variant} className={className}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/Card", () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardHeader: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h3 data-testid="card-title">{children}</h3>
  ),
  CardContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
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
  absences: 0,
  lateHours: 0,
  overtimeHours: 0,
  basicSalary: 20000,
  ratePerDay: 1000,
  salaryAmount: 20000,
};

const defaultProps = {
  rows: [mockRow],
  filteredRows: [mockRow],
  selectedEmployee: null,
  setSelectedEmployee: vi.fn(),
  getEmployeeEarnings: () => [],
  getEmployeeDeductions: () => [],
  getEmployeeBenefits: () => [],
  getEmployeeNet: () => 20000,
  payroll: { name: "Payroll Jan", month: 1, year: 2025 },
  monthName: "January",
};

describe("PayslipMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Employee Payslips title when no employee selected", () => {
    render(<PayslipMode {...defaultProps} />);
    expect(screen.getByText("Employee Payslips")).toBeTruthy();
  });

  it("renders Print All button", () => {
    render(<PayslipMode {...defaultProps} />);
    expect(screen.getByText(/Print All/)).toBeTruthy();
  });

  it("renders employee cards in grid", () => {
    render(<PayslipMode {...defaultProps} />);
    expect(screen.getByText("EMP001")).toBeTruthy();
    expect(screen.getByText(/Doe/)).toBeTruthy();
  });

  it("shows 'No employees' when rows are empty", () => {
    render(<PayslipMode {...defaultProps} rows={[]} filteredRows={[]} />);
    expect(screen.getByText("No employees in this payroll.")).toBeTruthy();
  });

  it("calls setSelectedEmployee when employee card is clicked", () => {
    render(<PayslipMode {...defaultProps} />);
    const button = screen.getByText("EMP001").closest("button");
    fireEvent.click(button!);
    expect(defaultProps.setSelectedEmployee).toHaveBeenCalledWith("1");
  });

  it("renders payslip detail when employee is selected", () => {
    render(<PayslipMode {...defaultProps} selectedEmployee="1" />);
    expect(screen.getByText("Payslip")).toBeTruthy();
    expect(screen.getByText("Earnings")).toBeTruthy();
    expect(screen.getByText("Deductions")).toBeTruthy();
    expect(screen.getByText("Net Pay")).toBeTruthy();
  });

  it("renders Back button when employee is selected", () => {
    render(<PayslipMode {...defaultProps} selectedEmployee="1" />);
    expect(screen.getByText("Back to All Payslips")).toBeTruthy();
  });

  it("calls setSelectedEmployee(null) when Back is clicked", () => {
    render(<PayslipMode {...defaultProps} selectedEmployee="1" />);
    fireEvent.click(screen.getByText("Back to All Payslips"));
    expect(defaultProps.setSelectedEmployee).toHaveBeenCalledWith(null);
  });
});
