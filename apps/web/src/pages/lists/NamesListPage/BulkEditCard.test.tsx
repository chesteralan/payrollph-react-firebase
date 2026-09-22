import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { BulkEditCard } from "./BulkEditCard";
import { renderWithProviders } from "@/test/page-test-utils";

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    canView: () => true,
    canAdd: () => true,
    canEdit: () => true,
    canDelete: () => true,
  }),
}));

const defaultProps = {
  selectedCount: 3,
  groups: [{ id: "g1", name: "Group A", isActive: true }],
  positions: [{ id: "p1", name: "Position A", isActive: true }],
  areas: [{ id: "a1", name: "Area A", isActive: true }],
  statuses: [{ id: "s1", name: "Active", isActive: true }],
  bulkEditData: { groupId: "", positionId: "", areaId: "", statusId: "" },
  bulkLoading: false,
  onUpdate: vi.fn(),
  onApply: vi.fn(),
  onCancel: vi.fn(),
};

describe("BulkEditCard", () => {
  it("renders without crashing", () => {
    renderWithProviders(<BulkEditCard {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: /bulk edit 3 names/i }),
    ).toBeInTheDocument();
  });

  it("shows singular text for single selection", () => {
    renderWithProviders(<BulkEditCard {...defaultProps} selectedCount={1} />);
    expect(
      screen.getByRole("heading", { name: /bulk edit 1 name/i }),
    ).toBeInTheDocument();
  });

  it("renders group, position, area, status selects", () => {
    renderWithProviders(<BulkEditCard {...defaultProps} />);
    expect(screen.getByText("Group")).toBeInTheDocument();
    expect(screen.getByText("Position")).toBeInTheDocument();
    expect(screen.getByText("Area")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });
});
