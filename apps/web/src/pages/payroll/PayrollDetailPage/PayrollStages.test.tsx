import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StageSelector, DTRStage } from "./PayrollStages";
import type { ProcessingRow } from "../PayrollDetailPage.types";

vi.mock("@/components/ui/EditableCell", () => ({
  EditableCell: ({
    value,
    onChange,
  }: {
    value: number;
    onChange?: (v: string) => void;
  }) => (
    <input
      data-testid="editable-cell"
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
    />
  ),
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

describe("StageSelector", () => {
  it("renders all stage buttons", () => {
    render(
      <StageSelector
        stages={["salaries", "earnings", "deductions"]}
        activeStage="salaries"
        onStageChange={vi.fn()}
      />,
    );
    expect(screen.getByText("salaries")).toBeTruthy();
    expect(screen.getByText("earnings")).toBeTruthy();
    expect(screen.getByText("deductions")).toBeTruthy();
  });

  it("calls onStageChange when a stage button is clicked", () => {
    const onChange = vi.fn();
    render(
      <StageSelector
        stages={["salaries", "earnings"]}
        activeStage="salaries"
        onStageChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText("earnings"));
    expect(onChange).toHaveBeenCalledWith("earnings");
  });

  it("applies active class to the selected stage", () => {
    render(
      <StageSelector
        stages={["salaries", "earnings"]}
        activeStage="salaries"
        onStageChange={vi.fn()}
      />,
    );
    const salariesBtn = screen.getByText("salaries");
    expect(salariesBtn.className).toContain("border-primary-600");
  });
});

describe("DTRStage", () => {
  it("renders the DTR title", () => {
    render(
      <DTRStage
        rows={[]}
        startDate={null}
        endDate={null}
        updateRow={vi.fn()}
        onManageDTR={vi.fn()}
      />,
    );
    expect(screen.getByText("Daily Time Record")).toBeTruthy();
  });

  it("renders date range when both dates provided", () => {
    render(
      <DTRStage
        rows={[]}
        startDate="2026-01-01"
        endDate="2026-01-31"
        updateRow={vi.fn()}
        onManageDTR={vi.fn()}
      />,
    );
    expect(screen.getByText(/2026-01-01 to 2026-01-31/)).toBeTruthy();
  });

  it("does not render date range when dates are null", () => {
    render(
      <DTRStage
        rows={[]}
        startDate={null}
        endDate={null}
        updateRow={vi.fn()}
        onManageDTR={vi.fn()}
      />,
    );
    expect(screen.queryByText(/Auto-populated/)).toBeNull();
  });

  it("renders manage DTR button and calls onManageDTR", () => {
    const onManage = vi.fn();
    render(
      <DTRStage
        rows={[]}
        startDate={null}
        endDate={null}
        updateRow={vi.fn()}
        onManageDTR={onManage}
      />,
    );
    const btn = screen.getByText("Manage DTR Entries");
    fireEvent.click(btn);
    expect(onManage).toHaveBeenCalled();
  });

  it("renders empty state when no rows", () => {
    render(
      <DTRStage
        rows={[]}
        startDate={null}
        endDate={null}
        updateRow={vi.fn()}
        onManageDTR={vi.fn()}
      />,
    );
    expect(screen.getByText(/No employees in this payroll/)).toBeTruthy();
  });

  it("renders employee rows", () => {
    render(
      <DTRStage
        rows={[mockRow]}
        startDate="2026-01-01"
        endDate="2026-01-31"
        updateRow={vi.fn()}
        onManageDTR={vi.fn()}
      />,
    );
    expect(screen.getByText("E001")).toBeTruthy();
    expect(screen.getByText("Doe")).toBeTruthy();
  });

  it("renders 4 editable cells per row (daysWorked, absences, lateHours, overtimeHours)", () => {
    render(
      <DTRStage
        rows={[mockRow]}
        startDate={null}
        endDate={null}
        updateRow={vi.fn()}
        onManageDTR={vi.fn()}
      />,
    );
    const cells = screen.getAllByTestId("editable-cell");
    expect(cells).toHaveLength(4);
  });

  it("renders table headers", () => {
    render(
      <DTRStage
        rows={[]}
        startDate={null}
        endDate={null}
        updateRow={vi.fn()}
        onManageDTR={vi.fn()}
      />,
    );
    expect(screen.getByText("Employee")).toBeTruthy();
    expect(screen.getByText("Days Worked")).toBeTruthy();
    expect(screen.getByText("Absences")).toBeTruthy();
    expect(screen.getByText("Late (hrs)")).toBeTruthy();
    expect(screen.getByText("Overtime (hrs)")).toBeTruthy();
  });
});
