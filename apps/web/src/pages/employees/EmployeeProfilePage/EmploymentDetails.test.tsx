import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmploymentDetails } from "./EmploymentDetails";
import type { Employee, SelectOption } from "./EmployeeProfilePage.types";

const mockEmployee: Employee = {
  id: "e1",
  employeeCode: "EMP001",
  groupId: "g1",
  positionId: "p1",
  areaId: "a1",
  statusId: "Active",
  hireDate: "2024-01-15",
  regularizationDate: "2024-07-15",
};

const groups: SelectOption[] = [
  { id: "g1", name: "Engineering" },
  { id: "g2", name: "Marketing" },
];

const positions: SelectOption[] = [
  { id: "p1", name: "Developer" },
  { id: "p2", name: "Designer" },
];

const areas: SelectOption[] = [
  { id: "a1", name: "Office A" },
  { id: "a2", name: "Office B" },
];

const defaultProps = {
  employee: mockEmployee,
  groups,
  positions,
  areas,
  onUpdateEmployee: vi.fn(),
};

function setup(props?: Partial<typeof defaultProps>) {
  return { ...defaultProps, ...props };
}

describe("EmploymentDetails", () => {
  it("renders the card title", () => {
    render(<EmploymentDetails {...setup()} />);
    expect(screen.getByText("Employment Details")).toBeInTheDocument();
  });

  it("renders all group options", () => {
    render(<EmploymentDetails {...setup()} />);
    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Marketing")).toBeInTheDocument();
  });

  it("renders all position options", () => {
    render(<EmploymentDetails {...setup()} />);
    expect(screen.getByText("Developer")).toBeInTheDocument();
    expect(screen.getByText("Designer")).toBeInTheDocument();
  });

  it("renders all area options", () => {
    render(<EmploymentDetails {...setup()} />);
    expect(screen.getByText("Office A")).toBeInTheDocument();
    expect(screen.getByText("Office B")).toBeInTheDocument();
  });

  it("displays status as read-only", () => {
    render(<EmploymentDetails {...setup()} />);
    const statusInput = screen.getByDisplayValue("Active");
    expect(statusInput).toHaveAttribute("readonly");
  });

  it("calls onUpdateEmployee when group changes", () => {
    const onUpdate = vi.fn();
    render(<EmploymentDetails {...setup({ onUpdateEmployee: onUpdate })} />);
    fireEvent.change(screen.getByDisplayValue("Engineering"), {
      target: { value: "g2" },
    });
    expect(onUpdate).toHaveBeenCalledWith("groupId", "g2");
  });

  it("calls onUpdateEmployee when position changes", () => {
    const onUpdate = vi.fn();
    render(<EmploymentDetails {...setup({ onUpdateEmployee: onUpdate })} />);
    fireEvent.change(screen.getByDisplayValue("Developer"), {
      target: { value: "p2" },
    });
    expect(onUpdate).toHaveBeenCalledWith("positionId", "p2");
  });

  it("calls onUpdateEmployee when area changes", () => {
    const onUpdate = vi.fn();
    render(<EmploymentDetails {...setup({ onUpdateEmployee: onUpdate })} />);
    fireEvent.change(screen.getByDisplayValue("Office A"), {
      target: { value: "a2" },
    });
    expect(onUpdate).toHaveBeenCalledWith("areaId", "a2");
  });

  it("displays hire date formatted as date input value", () => {
    render(<EmploymentDetails {...setup()} />);
    const hireDateInput = screen.getByLabelText("Hire Date");
    expect(hireDateInput).toHaveValue("2024-01-15");
  });

  it("displays regularization date formatted as date input value", () => {
    render(<EmploymentDetails {...setup()} />);
    const regDateInput = screen.getByLabelText("Regularization Date");
    expect(regDateInput).toHaveValue("2024-07-15");
  });

  it("calls onUpdateEmployee when hire date changes", () => {
    const onUpdate = vi.fn();
    render(<EmploymentDetails {...setup({ onUpdateEmployee: onUpdate })} />);
    fireEvent.change(screen.getByLabelText("Hire Date"), {
      target: { value: "2025-03-01" },
    });
    expect(onUpdate).toHaveBeenCalledWith("hireDate", "2025-03-01");
  });

  it("renders Select Group default option", () => {
    render(<EmploymentDetails {...setup()} />);
    expect(screen.getByText("Select Group")).toBeInTheDocument();
  });

  it("renders Select Position default option", () => {
    render(<EmploymentDetails {...setup()} />);
    expect(screen.getByText("Select Position")).toBeInTheDocument();
  });

  it("renders Select Area default option", () => {
    render(<EmploymentDetails {...setup()} />);
    expect(screen.getByText("Select Area")).toBeInTheDocument();
  });
});
