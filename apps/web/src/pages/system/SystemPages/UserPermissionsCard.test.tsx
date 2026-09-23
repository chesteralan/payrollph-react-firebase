import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { UserPermissionsCard } from "./UserPermissionsCard";
import { renderWithProviders } from "@/test/page-test-utils";
import type { UserRestriction } from "@/types";

const defaultProps = {
  editingRestrictions: "user-123",
  restrictions: [] as UserRestriction[],
  onToggleRestriction: vi.fn(),
  onClose: vi.fn(),
};

describe("UserPermissionsCard", () => {
  it("renders the manage permissions heading", () => {
    renderWithProviders(<UserPermissionsCard {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: /manage permissions/i }),
    ).toBeInTheDocument();
  });

  it("renders the done button", () => {
    renderWithProviders(<UserPermissionsCard {...defaultProps} />);
    expect(screen.getByRole("button", { name: /done/i })).toBeInTheDocument();
  });

  it("renders department rows from constants", () => {
    renderWithProviders(<UserPermissionsCard {...defaultProps} />);
    expect(screen.getAllByText(/payroll/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/employees/i).length).toBeGreaterThan(0);
  });
});
