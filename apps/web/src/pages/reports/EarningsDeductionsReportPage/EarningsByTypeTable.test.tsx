import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EarningsByTypeTable } from "./EarningsByTypeTable";
import type { EarningTypeSummary } from "./EarningsDeductionsReportPage.types";

const formatCurrency = (v: number) => `₱${v.toFixed(2)}`;

const mockData: EarningTypeSummary[] = [
  { earningId: "1", name: "Basic Pay", totalAmount: 50000, employeeCount: 20 },
  { earningId: "2", name: "Overtime", totalAmount: 5000, employeeCount: 12 },
];

describe("EarningsByTypeTable", () => {
  it("renders table headers", () => {
    render(
      <EarningsByTypeTable
        earningSummaries={[]}
        totalEarnings={0}
        formatCurrency={formatCurrency}
      />,
    );
    expect(screen.getByText("Earning Type")).toBeInTheDocument();
    expect(screen.getByText("Employees")).toBeInTheDocument();
    expect(screen.getByText("Total Amount")).toBeInTheDocument();
  });

  it("renders earning rows", () => {
    render(
      <EarningsByTypeTable
        earningSummaries={mockData}
        totalEarnings={55000}
        formatCurrency={formatCurrency}
      />,
    );
    expect(screen.getByText("Basic Pay")).toBeInTheDocument();
    expect(screen.getByText("Overtime")).toBeInTheDocument();
    expect(screen.getByText("₱50000.00")).toBeInTheDocument();
  });

  it("renders total row", () => {
    render(
      <EarningsByTypeTable
        earningSummaries={mockData}
        totalEarnings={55000}
        formatCurrency={formatCurrency}
      />,
    );
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("₱55000.00")).toBeInTheDocument();
  });
});
