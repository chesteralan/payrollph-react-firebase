import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmployeeReportSummaryCards } from "./EmployeeReportSummaryCards";
import type { EmployeeReportData } from "./EmployeeReportPage.types";

const mockEmployees: EmployeeReportData[] = [
  {
    id: "1",
    employeeCode: "EMP001",
    name: "John Doe",
    isActive: true,
    salary: 30000,
    contacts: [],
  } as unknown as EmployeeReportData,
  {
    id: "2",
    employeeCode: "EMP002",
    name: "Jane Smith",
    isActive: false,
    salary: 25000,
    contacts: [],
  } as unknown as EmployeeReportData,
];

describe("EmployeeReportSummaryCards", () => {
  it("renders summary cards with counts", () => {
    render(<EmployeeReportSummaryCards employees={mockEmployees} />);
    expect(screen.getByText("Total Employees")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.getByText("Total Salary")).toBeInTheDocument();
  });

  it("displays correct total employees count", () => {
    render(<EmployeeReportSummaryCards employees={mockEmployees} />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("returns null for empty employees", () => {
    const { container } = render(<EmployeeReportSummaryCards employees={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
