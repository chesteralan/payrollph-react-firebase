import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SummaryCards } from "./SummaryCards";

const formatCurrency = (v: number) => `₱${v.toFixed(2)}`;

describe("SummaryCards", () => {
  it("renders all four summary cards", () => {
    render(
      <SummaryCards
        totalEarnings={100000}
        totalDeductions={20000}
        totalBenefitsEE={5000}
        totalBenefitsER={5000}
        formatCurrency={formatCurrency}
      />,
    );
    expect(screen.getByText("Total Earnings")).toBeInTheDocument();
    expect(screen.getByText("Total Deductions")).toBeInTheDocument();
    expect(screen.getByText("Total Benefits (EE)")).toBeInTheDocument();
    expect(screen.getByText("Total Benefits (ER)")).toBeInTheDocument();
  });

  it("displays formatted currency values", () => {
    render(
      <SummaryCards
        totalEarnings={100000}
        totalDeductions={20000}
        totalBenefitsEE={5000}
        totalBenefitsER={5000}
        formatCurrency={formatCurrency}
      />,
    );
    expect(screen.getByText("₱100000.00")).toBeInTheDocument();
    expect(screen.getByText("₱20000.00")).toBeInTheDocument();
    expect(screen.getAllByText("₱5000.00").length).toBe(2);
  });
});
