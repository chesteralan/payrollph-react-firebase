import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { BulkActionBar } from "./BulkActionBar";
import { renderWithProviders } from "@/test/page-test-utils";

const defaultProps = {
  selectedCount: 3,
  bulkLoading: false,
  canEdit: vi.fn(() => true),
  canDelete: vi.fn(() => true),
  onActivate: vi.fn(),
  onDeactivate: vi.fn(),
  onDelete: vi.fn(),
  onClearSelection: vi.fn(),
};

describe("BulkActionBar", () => {
  it("renders nothing when selectedCount is 0", () => {
    const { container } = renderWithProviders(
      <BulkActionBar {...defaultProps} selectedCount={0} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("shows selected count", () => {
    renderWithProviders(<BulkActionBar {...defaultProps} />);
    expect(screen.getByText(/3 users selected/i)).toBeInTheDocument();
  });

  it("shows singular when one selected", () => {
    renderWithProviders(
      <BulkActionBar {...defaultProps} selectedCount={1} />,
    );
    expect(screen.getByText(/1 user selected/i)).toBeInTheDocument();
  });
});
