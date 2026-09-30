import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComputationSummary } from "./ComputationSummary";
import type { ProcessingRow } from "../PayrollDetailPage.types";

vi.mock("@/utils/currency", () => ({
  formatCurrency: (v: number) => `₱${v.toLocaleString()}.00`,
}));

const mockRow: ProcessingRow = {
  nameId: "emp-1",
  employeeCode: "E001",
  firstName: "John",
  lastName: "Doe",
  groupId: "g1",
  positionId: "p1",
  areaId: "a1",
  daysWorked: 22,
  absences: 0,
  lateHours: 0,
  overtimeHours: 0,
  basicSalary: 30000,
  ratePerDay: 1363.64,
  salaryAmount: 30000,
};

describe("ComputationSummary", () => {
  it("renders column headers", () => {
    render(
      <ComputationSummary
        rows={[]}
        earningData={new Map()}
        deductionData={new Map()}
        benefitData={new Map()}
        getEmployeeGross={() => 0}
        getEmployeeNet={() => 0}
      />,
    );
    expect(screen.getByText("Employee")).toBeTruthy();
    expect(screen.getByText("Basic")).toBeTruthy();
    expect(screen.getByText("Earnings")).toBeTruthy();
    expect(screen.getByText("Gross")).toBeTruthy();
    expect(screen.getByText("Deductions")).toBeTruthy();
    expect(screen.getByText("Benefits (EE)")).toBeTruthy();
    expect(screen.getByText("Net Pay")).toBeTruthy();
  });

  it("shows empty state when no rows", () => {
    render(
      <ComputationSummary
        rows={[]}
        earningData={new Map()}
        deductionData={new Map()}
        benefitData={new Map()}
        getEmployeeGross={() => 0}
        getEmployeeNet={() => 0}
      />,
    );
    expect(screen.getByText("No employees in this payroll.")).toBeTruthy();
  });

  it("renders employee row with computed values", () => {
    render(
      <ComputationSummary
        rows={[mockRow]}
        earningData={new Map()}
        deductionData={new Map()}
        benefitData={new Map()}
        getEmployeeGross={() => 30000}
        getEmployeeNet={() => 28000}
      />,
    );
    expect(screen.getByText("E001")).toBeTruthy();
    expect(screen.getByText("Doe")).toBeTruthy();
    expect(screen.getByText("Total")).toBeTruthy();
  });

  it("computes earnings from earningData", () => {
    const earningData = new Map([["emp-1", new Map([["e1", 5000]])]]);
    render(
      <ComputationSummary
        rows={[mockRow]}
        earningData={earningData}
        deductionData={new Map()}
        benefitData={new Map()}
        getEmployeeGross={() => 35000}
        getEmployeeNet={() => 35000}
      />,
    );
    expect(screen.getByText("E001")).toBeTruthy();
  });

  it("computes deductions from deductionData", () => {
    const deductionData = new Map([["emp-1", new Map([["d1", 2000]])]]);
    render(
      <ComputationSummary
        rows={[mockRow]}
        earningData={new Map()}
        deductionData={deductionData}
        benefitData={new Map()}
        getEmployeeGross={() => 30000}
        getEmployeeNet={() => 28000}
      />,
    );
    expect(screen.getByText("E001")).toBeTruthy();
  });

  it("computes benefits from benefitData", () => {
    const benefitData = new Map([
      ["emp-1", new Map([["b1", { employeeShare: 500, employerShare: 600 }]])],
    ]);
    render(
      <ComputationSummary
        rows={[mockRow]}
        earningData={new Map()}
        deductionData={new Map()}
        benefitData={benefitData}
        getEmployeeGross={() => 30000}
        getEmployeeNet={() => 29500}
      />,
    );
    expect(screen.getByText("E001")).toBeTruthy();
  });
});
