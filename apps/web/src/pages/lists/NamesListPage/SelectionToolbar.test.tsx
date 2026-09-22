import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { SelectionToolbar } from "./SelectionToolbar";
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
  selectedCount: 2,
  onBulkEdit: vi.fn(),
  onBulkDelete: vi.fn(),
  onClear: vi.fn(),
};

describe("SelectionToolbar", () => {
  it("renders nothing when no selection", () => {
    const { container } = renderWithProviders(
      <SelectionToolbar {...defaultProps} selectedCount={0} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows selected count", () => {
    renderWithProviders(<SelectionToolbar {...defaultProps} />);
    expect(screen.getByText(/2 names selected/i)).toBeInTheDocument();
  });

  it("shows singular for one selection", () => {
    renderWithProviders(
      <SelectionToolbar {...defaultProps} selectedCount={1} />,
    );
    expect(screen.getByText(/1 name selected/i)).toBeInTheDocument();
  });

  it("renders bulk edit and clear buttons", () => {
    renderWithProviders(<SelectionToolbar {...defaultProps} />);
    expect(screen.getByText(/bulk edit/i)).toBeInTheDocument();
    expect(screen.getByText(/clear selection/i)).toBeInTheDocument();
  });
});
