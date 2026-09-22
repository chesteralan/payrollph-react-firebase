import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { EarningsPage } from "./EarningsPage";
import { renderWithProviders } from "@/test/page-test-utils";
import { addMockDocs, clearMockDocs } from "../../../__mocks__/firebase";

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    canView: () => true,
    canAdd: () => true,
    canEdit: () => true,
    canDelete: () => true,
  }),
}));

vi.mock("@/utils/exportUtils", () => ({
  earningExportColumns: [],
  exportToCSV: vi.fn(),
  exportToXLS: vi.fn(),
}));

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("EarningsPage", () => {
  it("renders without crashing", () => {
    addMockDocs("earnings", []);
    renderWithProviders(<EarningsPage />);
    expect(
      screen.getByRole("heading", { name: /earnings/i }),
    ).toBeInTheDocument();
  });

  it("shows no earnings message when list is empty", async () => {
    addMockDocs("earnings", []);
    renderWithProviders(<EarningsPage />);
    await waitFor(() => {
      expect(screen.getByText(/no earnings found/i)).toBeInTheDocument();
    });
  });
});
