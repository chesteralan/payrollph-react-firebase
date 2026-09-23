import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { CompanyTable } from "./CompanyTable";
import type { Company } from "@/types";
import { renderWithProviders } from "@/test/page-test-utils";

const mockCompany: Company = {
  id: "1",
  name: "Acme Corp",
  address: "123 Main St",
  tin: "123-456-789",
  defaultWorkdays: 22,
  isActive: true,
  isDeleted: false,
  columnGroup: {
    dtr: true,
    salaries: true,
    earnings: false,
    benefits: false,
    deductions: false,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const defaultProps = {
  companies: [mockCompany],
  loading: false,
  searchQuery: "",
  sortConfig: null,
  canEdit: vi.fn(() => true),
  canDelete: vi.fn(() => true),
  onSearchChange: vi.fn(),
  onEdit: vi.fn(),
  onToggleStatus: vi.fn(),
  onSoftDelete: vi.fn(),
  onRestore: vi.fn(),
  onPermanentDelete: vi.fn(),
  onSort: vi.fn(),
};

describe("CompanyTable", () => {
  it("renders table headers", () => {
    renderWithProviders(<CompanyTable {...defaultProps} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Address")).toBeInTheDocument();
    expect(screen.getByText("TIN")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("renders company row with data", () => {
    renderWithProviders(<CompanyTable {...defaultProps} />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
    expect(screen.getByText("123-456-789")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    renderWithProviders(
      <CompanyTable {...defaultProps} companies={[]} loading={true} />,
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows empty state when no companies", () => {
    renderWithProviders(<CompanyTable {...defaultProps} companies={[]} />);
    expect(screen.getByText("No companies found")).toBeInTheDocument();
  });

  it("renders search input", () => {
    renderWithProviders(<CompanyTable {...defaultProps} />);
    expect(
      screen.getByPlaceholderText(/search companies/i),
    ).toBeInTheDocument();
  });

  it("displays Archived status for deleted companies", () => {
    const deletedCompany = { ...mockCompany, isDeleted: true };
    renderWithProviders(
      <CompanyTable {...defaultProps} companies={[deletedCompany]} />,
    );
    expect(screen.getByText("Archived")).toBeInTheDocument();
  });
});
