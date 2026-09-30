import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeductionsByTypeTable } from "./DeductionsByTypeTable";
import type { DeductionTypeSummary } from "./EarningsDeductionsReportPage.types";

const formatCurrency = (v: number) => `₱${v.toFixed(2)}`;

const mockData: DeductionTypeSummary[] = [
  { deductionId: "1", name: "SSS Loan", totalAmount: 3000, employeeCount: 5 },
  {
    deductionId: "2",
    name: "Pag-IBIG Loan",
    totalAmount: 1500,
    employeeCount: 3,
  },
];

describe("DeductionsByTypeTable", () => {
  it("renders table headers", () => {
    render(
      <DeductionsByTypeTable
        deductionSummaries={[]}
        totalDeductions={0}
        formatCurrency={formatCurrency}
      />,
    );
    expect(screen.getByText("Deduction Type")).toBeInTheDocument();
    expect(screen.getByText("Employees")).toBeInTheDocument();
    expect(screen.getByText("Total Amount")).toBeInTheDocument();
  });

  it("renders deduction rows", () => {
    render(
      <DeductionsByTypeTable
        deductionSummaries={mockData}
        totalDeductions={4500}
        formatCurrency={formatCurrency}
      />,
    );
    expect(screen.getByText("SSS Loan")).toBeInTheDocument();
    expect(screen.getByText("Pag-IBIG Loan")).toBeInTheDocument();
    expect(screen.getByText("₱3000.00")).toBeInTheDocument();
  });

  it("renders total row", () => {
    render(
      <DeductionsByTypeTable
        deductionSummaries={mockData}
        totalDeductions={4500}
        formatCurrency={formatCurrency}
      />,
    );
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("₱4500.00")).toBeInTheDocument();
  });
});
