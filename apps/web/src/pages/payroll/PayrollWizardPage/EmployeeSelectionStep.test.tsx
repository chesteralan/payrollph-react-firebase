import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmployeeSelectionStep } from "./EmployeeSelectionStep";

const mockEmployees = [
  { id: "1", nameId: "emp-001", employeeCode: "E001" },
  { id: "2", nameId: "emp-002", employeeCode: "E002" },
  { id: "3", nameId: "emp-003", employeeCode: "E003" },
];

const defaultProps = {
  employees: mockEmployees,
  selectedEmployeeIds: [],
  onToggleEmployee: vi.fn(),
  onNext: vi.fn(),
  onBack: vi.fn(),
};

describe("EmployeeSelectionStep", () => {
  it("renders the heading", () => {
    render(<EmployeeSelectionStep {...defaultProps} />);
    expect(screen.getByText("Select Employees")).toBeTruthy();
  });

  it("renders all employee items", () => {
    render(<EmployeeSelectionStep {...defaultProps} />);
    expect(screen.getByText("E001")).toBeTruthy();
    expect(screen.getByText("E002")).toBeTruthy();
    expect(screen.getByText("E003")).toBeTruthy();
    expect(screen.getByText("emp-001")).toBeTruthy();
    expect(screen.getByText("emp-002")).toBeTruthy();
    expect(screen.getByText("emp-003")).toBeTruthy();
  });

  it("checks selected employees", () => {
    render(
      <EmployeeSelectionStep
        {...defaultProps}
        selectedEmployeeIds={["1", "3"]}
      />,
    );
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).toBeChecked();
  });

  it("calls onToggleEmployee when a checkbox is clicked", () => {
    const onToggleEmployee = vi.fn();
    render(
      <EmployeeSelectionStep
        {...defaultProps}
        onToggleEmployee={onToggleEmployee}
      />,
    );
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]);
    expect(onToggleEmployee).toHaveBeenCalledWith("2");
  });

  it("calls onNext when Next is clicked", () => {
    const onNext = vi.fn();
    render(<EmployeeSelectionStep {...defaultProps} onNext={onNext} />);
    fireEvent.click(screen.getByText("Next"));
    expect(onNext).toHaveBeenCalled();
  });

  it("calls onBack when Back is clicked", () => {
    const onBack = vi.fn();
    render(<EmployeeSelectionStep {...defaultProps} onBack={onBack} />);
    fireEvent.click(screen.getByText("Back"));
    expect(onBack).toHaveBeenCalled();
  });
});
