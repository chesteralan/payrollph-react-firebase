import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BenefitsSummaryTable } from "./BenefitsSummaryTable";
import type { BenefitSummary } from "./EarningsDeductionsReportPage.types";

const formatCurrency = (v: number) => `₱${v.toFixed(2)}`;

const mockData: BenefitSummary[] = [
  { benefitId: "1", name: "SSS", totalEE: 1000, totalER: 2000, employeeCount: 10 },
  { benefitId: "2", name: "PhilHealth", totalEE: 500, totalER: 500, employeeCount: 8 },
];

describe("BenefitsSummaryTable", () => {
  it("renders table headers", () => {
    render(
      <BenefitsSummaryTable
        benefitSummaries={[]}
        totalBenefitsEE={0}
        totalBenefitsER={0}
        formatCurrency={formatCurrency}
      />,
    );
    expect(screen.getByText("Benefit Type")).toBeInTheDocument();
    expect(screen.getByText("EE Share")).toBeInTheDocument();
    expect(screen.getByText("ER Share")).toBeInTheDocument();
    expect(screen.getAllByText("Total").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Employees")).toBeInTheDocument();
  });

  it("renders benefit rows", () => {
    render(
      <BenefitsSummaryTable
        benefitSummaries={mockData}
        totalBenefitsEE={1500}
        totalBenefitsER={2500}
        formatCurrency={formatCurrency}
      />,
    );
    expect(screen.getByText("SSS")).toBeInTheDocument();
    expect(screen.getByText("PhilHealth")).toBeInTheDocument();
    expect(screen.getAllByText("₱1000.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("₱2000.00")).toBeInTheDocument();
  });

  it("renders total row", () => {
    render(
      <BenefitsSummaryTable
        benefitSummaries={mockData}
        totalBenefitsEE={1500}
        totalBenefitsER={2500}
        formatCurrency={formatCurrency}
      />,
    );
    expect(screen.getAllByText("Total").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("₱1500.00")).toBeInTheDocument();
    expect(screen.getByText("₱2500.00")).toBeInTheDocument();
  });
});
