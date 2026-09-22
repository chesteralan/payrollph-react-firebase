import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransmittalMode } from "./TransmittalMode";
import type { ProcessingRow } from "./PayrollOutputView.types";

vi.mock("lucide-react", () => ({
  Printer: () => <svg data-testid="icon-printer" />,
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
  absences: 0,
  lateHours: 0,
  overtimeHours: 0,
  basicSalary: 20000,
  ratePerDay: 1000,
  salaryAmount: 20000,
};

const defaultProps = {
  rows: [mockRow],
  getEmployeeNet: () => 20000,
  totals: { totalNet: 20000 },
  company: { name: "Test Company" },
  payroll: { name: "Payroll Jan", month: 1, year: 2025 },
  monthName: "January",
};

describe("TransmittalMode", () => {
  it("renders the title", () => {
    render(<TransmittalMode {...defaultProps} />);
    expect(screen.getByText("Bank Transmittal List")).toBeTruthy();
  });

  it("renders subtitle", () => {
    render(<TransmittalMode {...defaultProps} />);
    expect(screen.getByText("Employee net pay amounts for bank transfer")).toBeTruthy();
  });

  it("renders employee rows", () => {
    render(<TransmittalMode {...defaultProps} />);
    expect(screen.getByText("EMP001")).toBeTruthy();
  });

  it("renders employee name", () => {
    render(<TransmittalMode {...defaultProps} />);
    expect(screen.getByText(/Doe/)).toBeTruthy();
  });

  it("renders row number", () => {
    render(<TransmittalMode {...defaultProps} />);
    expect(screen.getByText("1")).toBeTruthy();
  });

  it("renders total row with employee count", () => {
    render(<TransmittalMode {...defaultProps} />);
    expect(screen.getByText(/1 employees/)).toBeTruthy();
  });

  it("renders 'No employees' when rows are empty", () => {
    render(<TransmittalMode {...defaultProps} rows={[]} />);
    expect(screen.getByText("No employees in this payroll.")).toBeTruthy();
  });

  it("renders multiple employees", () => {
    const rows: ProcessingRow[] = [
      mockRow,
      { ...mockRow, nameId: "2", employeeCode: "EMP002", firstName: "Jane", lastName: "Smith" },
    ];
    render(<TransmittalMode {...defaultProps} rows={rows} totals={{ totalNet: 40000 }} />);
    expect(screen.getByText("EMP001")).toBeTruthy();
    expect(screen.getByText("EMP002")).toBeTruthy();
    expect(screen.getByText(/2 employees/)).toBeTruthy();
  });
});
