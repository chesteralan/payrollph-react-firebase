import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SalaryCard } from "./SalaryCard";
import type { EmployeeSalary } from "./EmployeeProfilePage.types";

const mockSalary: EmployeeSalary = {
  id: "s1",
  employeeId: "e1",
  amount: 50000,
  frequency: "monthly",
  effectiveDate: "2024-01-01",
};

const defaultForm = {
  amount: "50000",
  frequency: "monthly" as const,
  effectiveDate: "2024-01-01",
};

const defaultProps = {
  salaryForm: defaultForm,
  onSalaryFormChange: vi.fn(),
  salary: mockSalary,
  onSaveSalary: vi.fn(),
  saving: false,
  formatCurrency: (v: number) => `₱${v.toLocaleString()}`,
};

function setup(props?: Partial<typeof defaultProps>) {
  return { ...defaultProps, ...props };
}

describe("SalaryCard", () => {
  it("renders the card title", () => {
    render(<SalaryCard {...setup()} />);
    expect(screen.getByText("Salary & Compensation")).toBeInTheDocument();
  });

  it("renders the current salary section", () => {
    render(<SalaryCard {...setup()} />);
    expect(screen.getByText("Current Salary")).toBeInTheDocument();
  });

  it("renders salary amount input with correct value", () => {
    render(<SalaryCard {...setup()} />);
    expect(screen.getByLabelText("Amount")).toHaveValue(50000);
  });

  it("renders frequency select with correct value", () => {
    render(<SalaryCard {...setup()} />);
    expect(screen.getByDisplayValue("Monthly")).toBeInTheDocument();
  });

  it("renders effective date input with correct value", () => {
    render(<SalaryCard {...setup()} />);
    expect(screen.getByLabelText("Effective Date")).toHaveValue("2024-01-01");
  });

  it("displays effective date text when salary exists", () => {
    render(<SalaryCard {...setup()} />);
    expect(screen.getByText(/Effective:/)).toBeInTheDocument();
  });

  it("calls onSaveSalary when Save Salary is clicked", () => {
    const onSave = vi.fn();
    render(<SalaryCard {...setup({ onSaveSalary: onSave })} />);
    fireEvent.click(screen.getByText("Save Salary"));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("disables Save Salary button when saving", () => {
    render(<SalaryCard {...setup({ saving: true })} />);
    expect(screen.getByText("Saving...")).toBeDisabled();
  });

  it("shows computed rate cards when salary exists", () => {
    render(<SalaryCard {...setup()} />);
    expect(screen.getByText("Monthly Rate")).toBeInTheDocument();
    expect(screen.getByText("Daily Rate")).toBeInTheDocument();
    expect(screen.getByText("Hourly Rate")).toBeInTheDocument();
    expect(screen.getByText("Pay Frequency")).toBeInTheDocument();
  });

  it("shows monthly salary amount in Monthly Rate", () => {
    render(<SalaryCard {...setup()} />);
    expect(screen.getByText("₱50,000")).toBeInTheDocument();
  });

  it("shows pay frequency capitalized", () => {
    render(<SalaryCard {...setup()} />);
    expect(screen.getByText("monthly")).toBeInTheDocument();
  });

  it("hides rate cards when salary is null", () => {
    render(<SalaryCard {...setup({ salary: null })} />);
    expect(screen.queryByText("Monthly Rate")).not.toBeInTheDocument();
  });

  it("calls onSalaryFormChange when amount input changes", () => {
    const onChange = vi.fn();
    render(<SalaryCard {...setup({ onSalaryFormChange: onChange })} />);
    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "60000" },
    });
    expect(onChange).toHaveBeenCalled();
  });

  it("calls onSalaryFormChange when frequency select changes", () => {
    const onChange = vi.fn();
    render(<SalaryCard {...setup({ onSalaryFormChange: onChange })} />);
    fireEvent.change(screen.getByDisplayValue("Monthly"), {
      target: { value: "semi-monthly" },
    });
    expect(onChange).toHaveBeenCalled();
  });

  it("computes daily rate from monthly salary", () => {
    render(<SalaryCard {...setup()} />);
    expect(screen.getByText("₱2,272.727")).toBeInTheDocument();
  });

  it("computes hourly rate from monthly salary", () => {
    render(<SalaryCard {...setup()} />);
    expect(screen.getByText("₱284.091")).toBeInTheDocument();
  });

  it("computes monthly rate from semi-monthly salary", () => {
    const semiMonthlySalary: EmployeeSalary = {
      ...mockSalary,
      frequency: "semi-monthly",
      amount: 25000,
    };
    render(
      <SalaryCard
        {...setup({
          salary: semiMonthlySalary,
          salaryForm: { amount: "25000", frequency: "semi-monthly", effectiveDate: "2024-01-01" },
        })}
      />,
    );
    expect(screen.getByText("₱50,000")).toBeInTheDocument();
  });

  it("computes monthly rate from weekly salary", () => {
    const weeklySalary: EmployeeSalary = {
      ...mockSalary,
      frequency: "weekly",
      amount: 12000,
    };
    render(
      <SalaryCard
        {...setup({
          salary: weeklySalary,
          salaryForm: { amount: "12000", frequency: "weekly", effectiveDate: "2024-01-01" },
        })}
      />,
    );
    expect(screen.getByText("₱51,960")).toBeInTheDocument();
  });
});
