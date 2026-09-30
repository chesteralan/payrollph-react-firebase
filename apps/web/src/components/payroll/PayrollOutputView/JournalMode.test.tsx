import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { JournalMode } from "./JournalMode";

vi.mock("lucide-react", () => ({
  Printer: () => <svg data-testid="icon-printer" />,
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
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
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

const defaultProps = {
  totals: {
    totalBasic: 20000,
    totalEarnings: 1000,
    totalBenefitsER: 500,
    totalBenefitsEE: 300,
    totalDeductions: 200,
    totalNet: 20500,
  },
  company: { name: "Test Company" },
  payroll: { name: "Payroll Jan", month: 1, year: 2025 },
  monthName: "January",
};

describe("JournalMode", () => {
  it("renders the title", () => {
    render(<JournalMode {...defaultProps} />);
    expect(screen.getByText("Journal Entry")).toBeTruthy();
  });

  it("renders subtitle with month and year", () => {
    render(<JournalMode {...defaultProps} />);
    expect(screen.getByText("January 2025 - Accounting summary")).toBeTruthy();
  });

  it("renders Salaries & Wages Expense account", () => {
    render(<JournalMode {...defaultProps} />);
    expect(screen.getByText("Salaries & Wages Expense")).toBeTruthy();
  });

  it("renders Earnings Expense account", () => {
    render(<JournalMode {...defaultProps} />);
    expect(screen.getByText("Earnings Expense")).toBeTruthy();
  });

  it("renders Employer Benefits Expense account", () => {
    render(<JournalMode {...defaultProps} />);
    expect(screen.getByText("Employer Benefits Expense")).toBeTruthy();
  });

  it("renders Withholding Tax Payable account", () => {
    render(<JournalMode {...defaultProps} />);
    expect(screen.getByText("Withholding Tax Payable")).toBeTruthy();
  });

  it("renders Employee Benefits Payable account", () => {
    render(<JournalMode {...defaultProps} />);
    expect(screen.getByText("Employee Benefits Payable")).toBeTruthy();
  });

  it("renders Other Deductions Payable account", () => {
    render(<JournalMode {...defaultProps} />);
    expect(screen.getByText("Other Deductions Payable")).toBeTruthy();
  });

  it("renders Salaries & Wages Payable account", () => {
    render(<JournalMode {...defaultProps} />);
    expect(screen.getByText("Salaries & Wages Payable")).toBeTruthy();
  });

  it("renders Total row", () => {
    render(<JournalMode {...defaultProps} />);
    expect(screen.getByText("Total")).toBeTruthy();
  });
});
