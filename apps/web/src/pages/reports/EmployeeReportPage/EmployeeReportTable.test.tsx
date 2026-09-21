import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmployeeReportTable } from "./EmployeeReportTable";
import type { EmployeeReportData } from "./EmployeeReportPage.types";

const mockEmployees: EmployeeReportData[] = [
  {
    id: "1",
    employeeCode: "EMP001",
    name: "John Doe",
    groupName: "Engineering",
    positionName: "Developer",
    areaName: "Main Office",
    isActive: true,
    salary: 30000,
    salaryFrequency: "monthly",
    hireDate: "2024-01-15",
    contacts: [{ type: "phone", value: "09171234567", isPrimary: true }],
    profile: { sss: "12-3456789-0", tin: "123-456-789" },
  } as unknown as EmployeeReportData,
];

describe("EmployeeReportTable", () => {
  it("renders table title", () => {
    render(
      <EmployeeReportTable
        employees={[]}
        expandedRows={new Set()}
        onToggleRow={vi.fn()}
      />,
    );
    expect(screen.getByText("Employee Master List")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(
      <EmployeeReportTable
        employees={[]}
        expandedRows={new Set()}
        onToggleRow={vi.fn()}
      />,
    );
    expect(screen.getByText("Code")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Group")).toBeInTheDocument();
    expect(screen.getByText("Position")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
  });

  it("renders employee data", () => {
    render(
      <EmployeeReportTable
        employees={mockEmployees}
        expandedRows={new Set()}
        onToggleRow={vi.fn()}
      />,
    );
    expect(screen.getByText("EMP001")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
