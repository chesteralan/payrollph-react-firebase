import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmployeeReportFilters } from "./EmployeeReportFilters";
import type { EmployeeReportFilters as FilterType } from "./useEmployeeReport";
import type { EmployeeArea, EmployeeGroup, EmployeePosition } from "@/types";

const filters: FilterType = {
  status: "all",
  groupId: "",
  positionId: "",
  areaId: "",
};

const groups: EmployeeGroup[] = [
  {
    id: "g1",
    name: "Engineering",
    companyId: "c1",
    isActive: true,
  } as EmployeeGroup,
];
const positions: EmployeePosition[] = [
  {
    id: "p1",
    name: "Developer",
    companyId: "c1",
    isActive: true,
  } as EmployeePosition,
];
const areas: EmployeeArea[] = [
  {
    id: "a1",
    name: "Main Office",
    companyId: "c1",
    isActive: true,
  } as EmployeeArea,
];

describe("EmployeeReportFilters", () => {
  it("renders filter labels", () => {
    render(
      <EmployeeReportFilters
        filters={filters}
        loading={false}
        groups={groups}
        positions={positions}
        areas={areas}
        onFilterChange={vi.fn()}
        onGenerate={vi.fn()}
      />,
    );
    expect(screen.getByText("Filters")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Group")).toBeInTheDocument();
    expect(screen.getByText("Position")).toBeInTheDocument();
    expect(screen.getByText("Area")).toBeInTheDocument();
  });

  it("renders generate button", () => {
    render(
      <EmployeeReportFilters
        filters={filters}
        loading={false}
        groups={[]}
        positions={[]}
        areas={[]}
        onFilterChange={vi.fn()}
        onGenerate={vi.fn()}
      />,
    );
    expect(screen.getByText("Generate Report")).toBeInTheDocument();
  });

  it("shows loading text when loading", () => {
    render(
      <EmployeeReportFilters
        filters={filters}
        loading={true}
        groups={[]}
        positions={[]}
        areas={[]}
        onFilterChange={vi.fn()}
        onGenerate={vi.fn()}
      />,
    );
    expect(screen.getByText("Generating...")).toBeInTheDocument();
  });
});
