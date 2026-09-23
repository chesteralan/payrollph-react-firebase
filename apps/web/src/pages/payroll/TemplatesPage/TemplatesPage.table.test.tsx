import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { TemplateTable } from "./TemplatesPage.table";
import { renderWithProviders } from "@/test/page-test-utils";
import type { PayrollTemplate, PrintFormat } from "./TemplatesPage.types";

beforeEach(() => {
  vi.clearAllMocks();
});

const mockTemplates: PayrollTemplate[] = [
  {
    id: "t1",
    name: "Monthly Template",
    description: "For monthly employees",
    companyId: "c1",
    isActive: true,
    printFormat: "register",
    earnings: ["basic", "overtime"],
    deductions: ["sss", "philhealth"],
    benefits: ["rice"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "t2",
    name: "Daily Template",
    companyId: "c1",
    isActive: true,
    printFormat: "payslip",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockPrintFormats: PrintFormat[] = [
  {
    id: "register",
    name: "Payroll Register",
    outputType: "register",
    paperSize: "A4",
    orientation: "portrait",
    isActive: true,
  },
  {
    id: "payslip",
    name: "Payslip",
    outputType: "payslip",
    paperSize: "A4",
    orientation: "portrait",
    isActive: true,
  },
];

const defaultProps = {
  templates: mockTemplates,
  loading: false,
  printFormats: mockPrintFormats,
  canAdd: vi.fn(() => true),
  canEdit: vi.fn(() => true),
  canDelete: vi.fn(() => true),
  onClone: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe("TemplateTable", () => {
  it("renders template names", () => {
    renderWithProviders(<TemplateTable {...defaultProps} />);
    expect(screen.getByText("Monthly Template")).toBeInTheDocument();
    expect(screen.getByText("Daily Template")).toBeInTheDocument();
  });

  it("renders template descriptions", () => {
    renderWithProviders(<TemplateTable {...defaultProps} />);
    expect(screen.getByText("For monthly employees")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    renderWithProviders(<TemplateTable {...defaultProps} loading={true} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows empty state when no templates", () => {
    renderWithProviders(<TemplateTable {...defaultProps} templates={[]} />);
    expect(screen.getByText("No templates found")).toBeInTheDocument();
  });

  it("renders print format names", () => {
    renderWithProviders(<TemplateTable {...defaultProps} />);
    expect(screen.getByText("Payroll Register")).toBeInTheDocument();
    expect(screen.getByText("Payslip")).toBeInTheDocument();
  });

  it("renders component count", () => {
    renderWithProviders(<TemplateTable {...defaultProps} />);
    expect(screen.getByText("5 items")).toBeInTheDocument();
  });

  it("renders action buttons when permissions allow", () => {
    renderWithProviders(<TemplateTable {...defaultProps} />);
    expect(screen.getAllByTitle("Clone").length).toBe(2);
  });
});
