import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BenefitsStage } from "./BenefitsStage";
import type { ProcessingRow } from "../PayrollDetailPage.types";

vi.mock("@/components/ui/EditableCell", () => ({
  EditableCell: ({
    value,
    onChange,
  }: {
    value: number;
    onChange: (v: string) => void;
  }) => (
    <input
      data-testid="editable-cell"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const mockRows: ProcessingRow[] = [
  {
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
  },
];

describe("BenefitsStage", () => {
  it("renders the benefits card with title", () => {
    render(
      <BenefitsStage
        rows={[]}
        benefitsList={[]}
        benefitData={new Map()}
        updateBenefit={vi.fn()}
      />,
    );
    expect(screen.getByText("Benefits")).toBeTruthy();
  });

  it("renders benefit column headers", () => {
    const benefitsList = [
      { id: "b1", name: "SSS" },
      { id: "b2", name: "PhilHealth" },
    ];
    render(
      <BenefitsStage
        rows={[]}
        benefitsList={benefitsList}
        benefitData={new Map()}
        updateBenefit={vi.fn()}
      />,
    );
    expect(screen.getByText("SSS (EE / ER)")).toBeTruthy();
    expect(screen.getByText("PhilHealth (EE / ER)")).toBeTruthy();
  });

  it("renders employee rows with benefit data", () => {
    const benefitsList = [{ id: "b1", name: "SSS" }];
    const benefitData = new Map([
      ["emp-1", new Map([["b1", { employeeShare: 500, employerShare: 600 }]])],
    ]);
    render(
      <BenefitsStage
        rows={mockRows}
        benefitsList={benefitsList}
        benefitData={benefitData}
        updateBenefit={vi.fn()}
      />,
    );
    expect(screen.getByText("E001")).toBeTruthy();
    expect(screen.getByText("Doe")).toBeTruthy();
  });

  it("renders empty cells for rows with no benefit data", () => {
    const benefitsList = [{ id: "b1", name: "SSS" }];
    render(
      <BenefitsStage
        rows={mockRows}
        benefitsList={benefitsList}
        benefitData={new Map()}
        updateBenefit={vi.fn()}
      />,
    );
    const cells = screen.getAllByTestId("editable-cell");
    expect(cells).toHaveLength(2);
  });

  it("shows correct number of editable cells per benefit", () => {
    const benefitsList = [
      { id: "b1", name: "SSS" },
      { id: "b2", name: "PhilHealth" },
    ];
    render(
      <BenefitsStage
        rows={mockRows}
        benefitsList={benefitsList}
        benefitData={new Map()}
        updateBenefit={vi.fn()}
      />,
    );
    const cells = screen.getAllByTestId("editable-cell");
    expect(cells).toHaveLength(4);
  });
});
