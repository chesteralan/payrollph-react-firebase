import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DenominationMode } from "./DenominationMode";
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
  totals: { totalNet: 20000 },
  getEmployeeNet: () => 20000,
  company: { name: "Test Company" },
  payroll: { name: "Payroll Jan", month: 1, year: 2025 },
  monthName: "January",
};

describe("DenominationMode", () => {
  it("renders the title", () => {
    render(<DenominationMode {...defaultProps} />);
    expect(screen.getByText("Cash Denomination Breakdown")).toBeTruthy();
  });

  it("renders subtitle", () => {
    render(<DenominationMode {...defaultProps} />);
    expect(screen.getByText("Cash payout preparation")).toBeTruthy();
  });

  it("renders denomination count section", () => {
    render(<DenominationMode {...defaultProps} />);
    expect(screen.getByText("Denomination Count")).toBeTruthy();
  });

  it("renders per employee cash breakdown section", () => {
    render(<DenominationMode {...defaultProps} />);
    expect(screen.getByText("Per Employee Cash Breakdown")).toBeTruthy();
  });

  it("renders employee code and name", () => {
    render(<DenominationMode {...defaultProps} />);
    expect(screen.getByText("EMP001")).toBeTruthy();
    expect(screen.getByText(/Doe/)).toBeTruthy();
  });

  it("renders denomination rows for common denominations", () => {
    render(<DenominationMode {...defaultProps} />);
    expect(screen.getByText("₱1,000")).toBeTruthy();
    expect(screen.getByText("₱500")).toBeTruthy();
    expect(screen.getByText("₱200")).toBeTruthy();
    expect(screen.getByText("₱100")).toBeTruthy();
  });

  it("renders total row", () => {
    render(<DenominationMode {...defaultProps} />);
    const totals = screen.getAllByText("Total");
    expect(totals.length).toBeGreaterThan(0);
  });

  it("renders with empty rows", () => {
    render(<DenominationMode {...defaultProps} rows={[]} />);
    expect(screen.getByText("Cash Denomination Breakdown")).toBeTruthy();
  });
});
