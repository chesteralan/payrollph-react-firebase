import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { TermsPage } from "./TermsPage";
import { renderWithProviders } from "@/test/page-test-utils";

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    canView: () => true,
    canAdd: () => true,
    canEdit: () => true,
    canDelete: () => true,
  }),
}));

describe("TermsPage", () => {
  it("renders the terms page heading", () => {
    renderWithProviders(<TermsPage />);
    expect(
      screen.getByRole("heading", { name: /terms/i }),
    ).toBeInTheDocument();
  });

  it("renders the add term button", () => {
    renderWithProviders(<TermsPage />);
    expect(
      screen.getByRole("button", { name: /add term/i }),
    ).toBeInTheDocument();
  });

  it("shows empty state when no terms", async () => {
    renderWithProviders(<TermsPage />);
    expect(
      await screen.findByText(/no terms found/i),
    ).toBeInTheDocument();
  });
});
