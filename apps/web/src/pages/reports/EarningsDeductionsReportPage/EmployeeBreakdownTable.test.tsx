import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmployeeBreakdownTable } from "./EmployeeBreakdownTable";
import type { EmployeeBreakdown } from "./EarningsDeductionsReportPage.types";

const formatCurrency = (v: number) => `₱${v.toFixed(2)}`;

const mockData: EmployeeBreakdown[] = [
  {
    nameId: "n1",
    employeeCode: "EMP001",
    firstName: "John",
    lastName: "Doe",
    groupName: "Engineering",
    earnings: [],
    deductions: [],
    benefits: [],
    totalEarnings: 30000,
    totalDeductions: 5000,
    totalBenefits: 2000,
  },
];

describe("EmployeeBreakdownTable", () => {
  it("renders table headers", () => {
    render(
      <EmployeeBreakdownTable
        employeeBreakdowns={[]}
        totalEarnings={0}
        totalDeductions={0}
        totalBenefitsEE={0}
        totalBenefitsER={0}
        formatCurrency={formatCurrency}
      />,
    );
    expect(screen.getByText("Employee")).toBeInTheDocument();
    expect(screen.getByText("Group")).toBeInTheDocument();
    expect(screen.getByText("Earnings")).toBeInTheDocument();
    expect(screen.getByText("Deductions")).toBeInTheDocument();
    expect(screen.getByText("Benefits")).toBeInTheDocument();
    expect(screen.getByText("Net")).toBeInTheDocument();
  });

  it("renders employee row", () => {
    render(
      <EmployeeBreakdownTable
        employeeBreakdowns={mockData}
        totalEarnings={30000}
        totalDeductions={5000}
        totalBenefitsEE={1000}
        totalBenefitsER={1000}
        formatCurrency={formatCurrency}
      />,
    );
    expect(screen.getByText("EMP001 - John Doe")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
  });

  it("renders total row", () => {
    render(
      <EmployeeBreakdownTable
        employeeBreakdowns={mockData}
        totalEarnings={30000}
        totalDeductions={5000}
        totalBenefitsEE={1000}
        totalBenefitsER={1000}
        formatCurrency={formatCurrency}
      />,
    );
    expect(screen.getByText("Total")).toBeInTheDocument();
  });
});
