import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeductionsStage } from "./DeductionsStage";
import type { ProcessingRow } from "../PayrollDetailPage.types";

vi.mock("@/components/ui/EditableCell", () => ({
  EditableCell: ({ value }: { value: number }) => (
    <input data-testid="editable-cell" value={value} readOnly />
  ),
}));

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

describe("DeductionsStage", () => {
  it("renders the deductions card with title", () => {
    render(
      <DeductionsStage
        rows={[]}
        deductionsList={[]}
        deductionData={new Map()}
        updateDeduction={vi.fn()}
        getDeductionTotal={() => 0}
      />,
    );
    expect(screen.getByText("Deductions")).toBeTruthy();
  });

  it("renders deduction column headers", () => {
    const deductionsList = [
      { id: "d1", name: "SSS" },
      { id: "d2", name: "Tax" },
    ];
    render(
      <DeductionsStage
        rows={[]}
        deductionsList={deductionsList}
        deductionData={new Map()}
        updateDeduction={vi.fn()}
        getDeductionTotal={() => 0}
      />,
    );
    expect(screen.getByText("SSS")).toBeTruthy();
    expect(screen.getByText("Tax")).toBeTruthy();
  });

  it("renders employee rows", () => {
    render(
      <DeductionsStage
        rows={[mockRow]}
        deductionsList={[{ id: "d1", name: "SSS" }]}
        deductionData={new Map()}
        updateDeduction={vi.fn()}
        getDeductionTotal={() => 0}
      />,
    );
    expect(screen.getByText("E001")).toBeTruthy();
    expect(screen.getByText("Doe")).toBeTruthy();
  });

  it("renders editable cells for each deduction", () => {
    render(
      <DeductionsStage
        rows={[mockRow]}
        deductionsList={[
          { id: "d1", name: "SSS" },
          { id: "d2", name: "Tax" },
        ]}
        deductionData={new Map()}
        updateDeduction={vi.fn()}
        getDeductionTotal={() => 0}
      />,
    );
    const cells = screen.getAllByTestId("editable-cell");
    expect(cells).toHaveLength(2);
  });

  it("renders total row", () => {
    render(
      <DeductionsStage
        rows={[mockRow]}
        deductionsList={[{ id: "d1", name: "SSS" }]}
        deductionData={new Map()}
        updateDeduction={vi.fn()}
        getDeductionTotal={() => 1500}
      />,
    );
    expect(screen.getByText("Total")).toBeTruthy();
  });

  it("renders deduction values from data", () => {
    const deductionData = new Map([
      ["emp-1", new Map([["d1", 1500]])],
    ]);
    render(
      <DeductionsStage
        rows={[mockRow]}
        deductionsList={[{ id: "d1", name: "SSS" }]}
        deductionData={deductionData}
        updateDeduction={vi.fn()}
        getDeductionTotal={() => 1500}
      />,
    );
    expect(screen.getByText("Total")).toBeTruthy();
  });
});
