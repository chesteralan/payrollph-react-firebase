import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { BenefitsPage } from "./BenefitsPage";
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
  benefitExportColumns: [],
  exportToCSV: vi.fn(),
  exportToXLS: vi.fn(),
}));

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("BenefitsPage", () => {
  it("renders without crashing", () => {
    addMockDocs("benefits", []);
    renderWithProviders(<BenefitsPage />);
    expect(
      screen.getByRole("heading", { name: /benefits/i }),
    ).toBeInTheDocument();
  });

  it("shows no benefits message when list is empty", async () => {
    addMockDocs("benefits", []);
    renderWithProviders(<BenefitsPage />);
    await waitFor(() => {
      expect(screen.getByText(/no benefits found/i)).toBeInTheDocument();
    });
  });
});
