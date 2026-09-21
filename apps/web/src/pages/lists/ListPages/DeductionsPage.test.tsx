import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { DeductionsPage } from "./DeductionsPage";
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
  deductionExportColumns: [],
  exportToCSV: vi.fn(),
  exportToXLS: vi.fn(),
}));

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("DeductionsPage", () => {
  it("renders without crashing", () => {
    addMockDocs("deductions", []);
    renderWithProviders(<DeductionsPage />);
    expect(
      screen.getByRole("heading", { name: /deductions/i }),
    ).toBeInTheDocument();
  });

  it("shows no deductions message when list is empty", async () => {
    addMockDocs("deductions", []);
    renderWithProviders(<DeductionsPage />);
    await waitFor(() => {
      expect(screen.getByText(/no deductions found/i)).toBeInTheDocument();
    });
  });
});
