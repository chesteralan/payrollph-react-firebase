import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GroupsStep } from "./GroupsStep";

const mockLookups = {
  groups: [
    { id: "g1", name: "Group A" },
    { id: "g2", name: "Group B" },
  ],
  positions: [
    { id: "p1", name: "Engineer" },
    { id: "p2", name: "Manager" },
  ],
  areas: [
    { id: "a1", name: "HR" },
    { id: "a2", name: "IT" },
  ],
  statuses: [
    { id: "s1", name: "Active" },
    { id: "s2", name: "Inactive" },
  ],
};

const defaultProps = {
  groups: [],
  onAddGroup: vi.fn(),
  onRemoveGroup: vi.fn(),
  onNext: vi.fn(),
  onBack: vi.fn(),
  loading: false,
  lookups: mockLookups,
};

describe("GroupsStep", () => {
  it("renders the heading", () => {
    render(<GroupsStep {...defaultProps} />);
    expect(screen.getByText("Employee Groups")).toBeTruthy();
  });

  it("renders empty state message when no groups", () => {
    render(<GroupsStep {...defaultProps} />);
    expect(
      screen.getByText(/No groups added\. Add filters/),
    ).toBeTruthy();
  });

  it("renders existing groups", () => {
    const groups = [
      {
        id: "",
        payrollId: "",
        groupId: "g1",
        positionId: "p1",
        areaId: "",
        statusId: "",
        order: 0,
        page: 1,
      },
    ];
    render(<GroupsStep {...defaultProps} groups={groups} />);
    expect(screen.getByText(/Group: g1 \| Position: p1/)).toBeTruthy();
  });

  it("calls onRemoveGroup when remove button is clicked", () => {
    const onRemoveGroup = vi.fn();
    const groups = [
      {
        id: "",
        payrollId: "",
        groupId: "g1",
        positionId: "p1",
        areaId: "a1",
        statusId: "s1",
        order: 0,
        page: 1,
      },
    ];
    render(
      <GroupsStep
        {...defaultProps}
        groups={groups}
        onRemoveGroup={onRemoveGroup}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "" }));
    expect(onRemoveGroup).toHaveBeenCalledWith(0);
  });

  it("calls onNext when Next is clicked", () => {
    const onNext = vi.fn();
    render(<GroupsStep {...defaultProps} onNext={onNext} />);
    fireEvent.click(screen.getByText("Next"));
    expect(onNext).toHaveBeenCalled();
  });

  it("calls onBack when Back is clicked", () => {
    const onBack = vi.fn();
    render(<GroupsStep {...defaultProps} onBack={onBack} />);
    fireEvent.click(screen.getByText("Back"));
    expect(onBack).toHaveBeenCalled();
  });

  it("disables Next button when loading", () => {
    render(<GroupsStep {...defaultProps} loading={true} />);
    expect(screen.getByText("Next").closest("button")).toBeDisabled();
  });

  it("renders lookup options in select dropdowns", () => {
    render(<GroupsStep {...defaultProps} />);
    expect(screen.getByText("Group A")).toBeTruthy();
    expect(screen.getByText("Group B")).toBeTruthy();
    expect(screen.getByText("Engineer")).toBeTruthy();
    expect(screen.getByText("Manager")).toBeTruthy();
    expect(screen.getByText("HR")).toBeTruthy();
    expect(screen.getByText("IT")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText("Inactive")).toBeTruthy();
  });
});
