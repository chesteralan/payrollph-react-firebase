import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompanyForm } from "./CompanyForm";
import type { CompanyFormData } from "./useCompanies";
import type { CompanyColumnGroup } from "./CompaniesPage.types";

const mockFormData: CompanyFormData = {
  name: "Test Corp",
  address: "123 Main St",
  tin: "123-456-789",
  printHeader: "Test Header",
  printFooter: "Test Footer",
  printCss: "",
  defaultWorkdays: 22,
  currency: "PHP",
  payrollPeriods: [],
};

const mockColumnGroup: CompanyColumnGroup = {
  dtr: true,
  salaries: true,
  earnings: false,
  benefits: false,
  deductions: false,
};

const defaultProps = {
  formData: mockFormData,
  columnGroup: mockColumnGroup,
  editingId: null,
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
  onFormDataChange: vi.fn(),
  onColumnGroupChange: vi.fn(),
  onAddPayrollPeriod: vi.fn(),
  onRemovePayrollPeriod: vi.fn(),
  onUpdatePayrollPeriod: vi.fn(),
};

describe("CompanyForm", () => {
  it("renders Add Company title when not editing", () => {
    render(<CompanyForm {...defaultProps} />);
    expect(screen.getByRole("heading", { name: /add company/i })).toBeInTheDocument();
  });

  it("renders Edit Company title when editing", () => {
    render(<CompanyForm {...defaultProps} editingId="some-id" />);
    expect(screen.getByRole("heading", { name: /edit company/i })).toBeInTheDocument();
  });

  it("renders form fields with initial values", () => {
    render(<CompanyForm {...defaultProps} />);
    expect(screen.getByLabelText(/company name/i)).toHaveValue("Test Corp");
    expect(screen.getByLabelText(/tin/i)).toHaveValue("123-456-789");
    expect(screen.getByLabelText(/address/i)).toHaveValue("123 Main St");
  });

  it("renders payroll periods section", () => {
    render(<CompanyForm {...defaultProps} />);
    expect(screen.getAllByText(/payroll periods/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /add period/i })).toBeInTheDocument();
  });

  it("shows empty state when no payroll periods", () => {
    render(<CompanyForm {...defaultProps} />);
    expect(screen.getByText(/no payroll periods configured/i)).toBeInTheDocument();
  });

  it("renders column groups checkboxes", () => {
    render(<CompanyForm {...defaultProps} />);
    expect(screen.getAllByText(/column groups/i).length).toBeGreaterThan(0);
    expect(screen.getByText("dtr")).toBeInTheDocument();
    expect(screen.getByText("salaries")).toBeInTheDocument();
  });

  it("renders submit and cancel buttons", () => {
    render(<CompanyForm {...defaultProps} />);
    expect(screen.getByRole("button", { name: /create/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });
});
