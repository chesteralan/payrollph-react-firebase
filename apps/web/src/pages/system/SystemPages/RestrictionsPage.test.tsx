import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { RestrictionsPage } from "./RestrictionsPage";
import { renderWithProviders } from "@/test/page-test-utils";

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    canView: () => true,
    canAdd: () => true,
    canEdit: () => true,
    canDelete: () => true,
  }),
}));

describe("RestrictionsPage", () => {
  it("renders the restrictions page heading", () => {
    renderWithProviders(<RestrictionsPage />);
    expect(
      screen.getByRole("heading", { name: /user restrictions/i }),
    ).toBeInTheDocument();
  });

  it("displays instructions about permissions", () => {
    renderWithProviders(<RestrictionsPage />);
    expect(
      screen.getByText(/manage permissions/i),
    ).toBeInTheDocument();
  });
});
