import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SalariesStage } from "./SalariesStage";
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

describe("SalariesStage", () => {
  it("renders the salaries card with title", () => {
    render(
      <SalariesStage
        rows={[]}
        actualWorkdays={null}
        defaultWorkdays={22}
        updateRow={vi.fn()}
      />,
    );
    expect(screen.getByText("Salaries")).toBeTruthy();
  });

  it("shows default workdays message when actualWorkdays is null", () => {
    render(
      <SalariesStage
        rows={[]}
        actualWorkdays={null}
        defaultWorkdays={22}
        updateRow={vi.fn()}
      />,
    );
    expect(screen.getByText(/22 workdays\/month \(default\)/)).toBeTruthy();
  });

  it("shows actual workdays message when actualWorkdays is provided", () => {
    render(
      <SalariesStage
        rows={[]}
        actualWorkdays={20}
        defaultWorkdays={22}
        updateRow={vi.fn()}
      />,
    );
    expect(screen.getByText(/20 actual workdays \(calendar-adjusted\)/)).toBeTruthy();
  });

  it("renders empty state when no rows", () => {
    render(
      <SalariesStage
        rows={[]}
        actualWorkdays={null}
        defaultWorkdays={22}
        updateRow={vi.fn()}
      />,
    );
    expect(screen.getByText("No employees in this payroll.")).toBeTruthy();
  });

  it("renders employee rows with salary data", () => {
    render(
      <SalariesStage
        rows={[mockRow]}
        actualWorkdays={22}
        defaultWorkdays={22}
        updateRow={vi.fn()}
      />,
    );
    expect(screen.getByText("E001")).toBeTruthy();
    expect(screen.getByText("Doe")).toBeTruthy();
  });

  it("renders table headers", () => {
    render(
      <SalariesStage
        rows={[]}
        actualWorkdays={null}
        defaultWorkdays={22}
        updateRow={vi.fn()}
      />,
    );
    expect(screen.getByText("Employee")).toBeTruthy();
    expect(screen.getByText("Basic Salary")).toBeTruthy();
    expect(screen.getByText("Rate/Day")).toBeTruthy();
    expect(screen.getByText("Days")).toBeTruthy();
    expect(screen.getByText("Salary Amount")).toBeTruthy();
  });

  it("renders editable cell for basicSalary", () => {
    render(
      <SalariesStage
        rows={[mockRow]}
        actualWorkdays={22}
        defaultWorkdays={22}
        updateRow={vi.fn()}
      />,
    );
    const cells = screen.getAllByTestId("editable-cell");
    expect(cells).toHaveLength(1);
  });
});
