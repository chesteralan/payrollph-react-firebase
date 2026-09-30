import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PayrollConfigStep } from "./PayrollConfigStep";

const defaultFormData = {
  name: "",
  month: 1,
  year: 2026,
  templateId: "",
  termId: "",
};

const defaultProps = {
  formData: defaultFormData,
  setFormData: vi.fn(),
  errors: {},
  setErrors: vi.fn(),
  templates: [
    { id: "t1", name: "Standard Template" },
    { id: "t2", name: "Executive Template" },
  ],
  terms: [
    { id: "term1", name: "Monthly Term", type: "monthly" },
    { id: "term2", name: "Semi-monthly Term", type: "semi-monthly" },
  ],
  onTermChange: vi.fn(),
  onNext: vi.fn(),
  loading: false,
};

describe("PayrollConfigStep", () => {
  it("renders the heading", () => {
    render(<PayrollConfigStep {...defaultProps} />);
    expect(screen.getByText("Payroll Configuration")).toBeTruthy();
  });

  it("renders the name input", () => {
    render(<PayrollConfigStep {...defaultProps} />);
    expect(
      screen.getByPlaceholderText("e.g., January 2026 Payroll"),
    ).toBeTruthy();
  });

  it("renders month select with month options", () => {
    render(<PayrollConfigStep {...defaultProps} />);
    expect(screen.getByText("January")).toBeTruthy();
    expect(screen.getByText("December")).toBeTruthy();
  });

  it("renders the year input", () => {
    render(<PayrollConfigStep {...defaultProps} />);
    expect(screen.getByText("Year")).toBeTruthy();
  });

  it("renders template select when templates exist", () => {
    render(<PayrollConfigStep {...defaultProps} />);
    expect(screen.getByText("Standard Template")).toBeTruthy();
    expect(screen.getByText("Executive Template")).toBeTruthy();
  });

  it("renders term select when terms exist", () => {
    render(<PayrollConfigStep {...defaultProps} />);
    expect(screen.getByText(/Monthly Term/)).toBeTruthy();
    expect(screen.getByText(/Semi-monthly Term/)).toBeTruthy();
  });

  it("displays error for name when errors.name is set", () => {
    render(
      <PayrollConfigStep
        {...defaultProps}
        errors={{ name: "Name is required" }}
      />,
    );
    expect(screen.getByText("Name is required")).toBeTruthy();
  });

  it("displays error for year when errors.year is set", () => {
    render(
      <PayrollConfigStep {...defaultProps} errors={{ year: "Invalid year" }} />,
    );
    expect(screen.getByText("Invalid year")).toBeTruthy();
  });

  it("disables Next button when name is empty", () => {
    render(<PayrollConfigStep {...defaultProps} />);
    expect(screen.getByText("Next").closest("button")).toBeDisabled();
  });

  it("enables Next button when name is provided", () => {
    render(
      <PayrollConfigStep
        {...defaultProps}
        formData={{ ...defaultFormData, name: "January 2026 Payroll" }}
      />,
    );
    expect(screen.getByText("Next").closest("button")).not.toBeDisabled();
  });

  it("shows 'Saving...' text when loading", () => {
    render(
      <PayrollConfigStep
        {...defaultProps}
        formData={{ ...defaultFormData, name: "January 2026 Payroll" }}
        loading={true}
      />,
    );
    expect(screen.getByText("Saving...")).toBeTruthy();
  });

  it("calls onNext when Next is clicked with valid data", () => {
    const onNext = vi.fn();
    render(
      <PayrollConfigStep
        {...defaultProps}
        formData={{ ...defaultFormData, name: "January 2026 Payroll" }}
        onNext={onNext}
      />,
    );
    fireEvent.click(screen.getByText("Next"));
    expect(onNext).toHaveBeenCalled();
  });

  it("calls onTermChange when term select changes", () => {
    const onTermChange = vi.fn();
    render(<PayrollConfigStep {...defaultProps} onTermChange={onTermChange} />);
    fireEvent.change(screen.getByDisplayValue("No term"), {
      target: { value: "term1" },
    });
    expect(onTermChange).toHaveBeenCalledWith("term1");
  });

  it("hides template and term selects when arrays are empty", () => {
    render(<PayrollConfigStep {...defaultProps} templates={[]} terms={[]} />);
    expect(screen.queryByText("Template (Optional)")).toBeNull();
    expect(screen.queryByText("Term (Optional)")).toBeNull();
  });
});
