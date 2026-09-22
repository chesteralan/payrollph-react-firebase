import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PayrollOutputView } from "./PayrollOutputView";
import type { PayrollOutputViewProps } from "./PayrollOutputView.types";

vi.mock("xlsx", () => ({
  utils: {
    book_new: vi.fn(() => ({})),
    json_to_sheet: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
    encode_cell: vi.fn(() => ""),
    writeFile: vi.fn(),
  },
}));

vi.mock("lucide-react", () => ({
  Printer: () => <svg data-testid="icon-printer" />,
  FileSpreadsheet: () => <svg data-testid="icon-spreadsheet" />,
  Download: () => <svg data-testid="icon-download" />,
  Filter: () => <svg data-testid="icon-filter" />,
  Columns: () => <svg data-testid="icon-columns" />,
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({ children, onClick, variant, className }: {
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

const defaultProps: PayrollOutputViewProps = {
  payroll: { name: "Payroll January 2025", month: 1, year: 2025, isLocked: false },
  company: { name: "Test Company" },
  rows: [
    {
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
    },
  ],
  earningData: new Map(),
  deductionData: new Map(),
  benefitData: new Map(),
  earningsList: [],
  deductionsList: [],
  benefitsList: [],
};

describe("PayrollOutputView", () => {
  it("renders payroll name and period", () => {
    render(<PayrollOutputView {...defaultProps} />);
    expect(screen.getAllByText("Payroll January 2025").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("January 2025").length).toBeGreaterThanOrEqual(1);
  });

  it("renders mode tabs", () => {
    render(<PayrollOutputView {...defaultProps} />);
    expect(screen.getAllByText("Payroll Register").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Payslips")).toBeTruthy();
    expect(screen.getByText("Transmittal")).toBeTruthy();
    expect(screen.getAllByText("Journal Entry").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Denomination")).toBeTruthy();
  });

  it("renders Print, Export XLS, and Export CSV buttons", () => {
    render(<PayrollOutputView {...defaultProps} />);
    expect(screen.getByText("Print")).toBeTruthy();
    expect(screen.getByText("Export XLS")).toBeTruthy();
    expect(screen.getByText("Export CSV")).toBeTruthy();
  });

  it("shows register mode by default", () => {
    render(<PayrollOutputView {...defaultProps} />);
    expect(screen.getAllByText("Payroll Register").length).toBeGreaterThanOrEqual(1);
  });

  it("switches to payslip mode when Payslips tab is clicked", () => {
    render(<PayrollOutputView {...defaultProps} />);
    fireEvent.click(screen.getByText("Payslips"));
    expect(screen.getByText("Employee Payslips")).toBeTruthy();
  });

  it("switches to transmittal mode when Transmittal tab is clicked", () => {
    render(<PayrollOutputView {...defaultProps} />);
    fireEvent.click(screen.getByText("Transmittal"));
    expect(screen.getByText("Bank Transmittal List")).toBeTruthy();
  });

  it("switches to journal mode when Journal Entry tab is clicked", () => {
    render(<PayrollOutputView {...defaultProps} />);
    fireEvent.click(screen.getAllByText("Journal Entry")[0]);
    expect(screen.getAllByText("Journal Entry").length).toBeGreaterThanOrEqual(1);
  });

  it("switches to denomination mode when Denomination tab is clicked", () => {
    render(<PayrollOutputView {...defaultProps} />);
    fireEvent.click(screen.getByText("Denomination"));
    expect(screen.getByText("Cash Denomination Breakdown")).toBeTruthy();
  });
});
