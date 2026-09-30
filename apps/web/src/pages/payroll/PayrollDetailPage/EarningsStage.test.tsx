import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EarningsStage } from "./EarningsStage";
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

describe("EarningsStage", () => {
  it("renders the earnings card with title", () => {
    render(
      <EarningsStage
        rows={[]}
        earningsList={[]}
        earningData={new Map()}
        updateEarning={vi.fn()}
        getEarningTotal={() => 0}
      />,
    );
    expect(screen.getByText("Earnings")).toBeTruthy();
  });

  it("renders earning column headers", () => {
    const earningsList = [
      { id: "e1", name: "Overtime" },
      { id: "e2", name: "Allowance" },
    ];
    render(
      <EarningsStage
        rows={[]}
        earningsList={earningsList}
        earningData={new Map()}
        updateEarning={vi.fn()}
        getEarningTotal={() => 0}
      />,
    );
    expect(screen.getByText("Overtime")).toBeTruthy();
    expect(screen.getByText("Allowance")).toBeTruthy();
  });

  it("renders employee rows", () => {
    render(
      <EarningsStage
        rows={[mockRow]}
        earningsList={[{ id: "e1", name: "Overtime" }]}
        earningData={new Map()}
        updateEarning={vi.fn()}
        getEarningTotal={() => 0}
      />,
    );
    expect(screen.getByText("E001")).toBeTruthy();
    expect(screen.getByText("Doe")).toBeTruthy();
  });

  it("renders editable cells for each earning", () => {
    render(
      <EarningsStage
        rows={[mockRow]}
        earningsList={[
          { id: "e1", name: "Overtime" },
          { id: "e2", name: "Allowance" },
        ]}
        earningData={new Map()}
        updateEarning={vi.fn()}
        getEarningTotal={() => 0}
      />,
    );
    const cells = screen.getAllByTestId("editable-cell");
    expect(cells).toHaveLength(2);
  });

  it("renders total row", () => {
    render(
      <EarningsStage
        rows={[mockRow]}
        earningsList={[{ id: "e1", name: "Overtime" }]}
        earningData={new Map()}
        updateEarning={vi.fn()}
        getEarningTotal={() => 5000}
      />,
    );
    expect(screen.getByText("Total")).toBeTruthy();
  });

  it("renders earning values from data", () => {
    const earningData = new Map([["emp-1", new Map([["e1", 5000]])]]);
    render(
      <EarningsStage
        rows={[mockRow]}
        earningsList={[{ id: "e1", name: "Overtime" }]}
        earningData={earningData}
        updateEarning={vi.fn()}
        getEarningTotal={() => 5000}
      />,
    );
    expect(screen.getByText("Total")).toBeTruthy();
  });
});
