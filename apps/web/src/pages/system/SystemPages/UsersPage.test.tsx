import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { UsersPage } from "./UsersPage";
import { renderWithProviders } from "@/test/page-test-utils";
import { addMockDocs, clearMockDocs } from "../../../__mocks__/firebase";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    canView: () => true,
    canAdd: () => true,
    canEdit: () => true,
    canDelete: () => true,
  }),
}));

describe("UsersPage", () => {
  it("renders the user accounts heading", () => {
    addMockDocs("user_accounts", []);
    addMockDocs("user_accounts_restrictions", []);
    renderWithProviders(<UsersPage />);
    expect(
      screen.getByRole("heading", { name: /user accounts/i }),
    ).toBeInTheDocument();
  });

  it("renders the import CSV button", () => {
    addMockDocs("user_accounts", []);
    addMockDocs("user_accounts_restrictions", []);
    renderWithProviders(<UsersPage />);
    expect(
      screen.getByRole("button", { name: /import csv/i }),
    ).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    addMockDocs("user_accounts", []);
    addMockDocs("user_accounts_restrictions", []);
    renderWithProviders(<UsersPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
