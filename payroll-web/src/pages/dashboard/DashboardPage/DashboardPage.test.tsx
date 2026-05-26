import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { DashboardPage } from "./DashboardPage";
import { renderWithProviders } from "@/test/page-test-utils";
import { addMockDocs, clearMockDocs } from "../../../__mocks__/firebase";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("DashboardPage", () => {
  it(
    "renders without crashing and shows dashboard content",
    { timeout: 15000 },
    async () => {
      addMockDocs("employees", [
        { id: "1", companyId: "test-company", isActive: true },
      ]);
      addMockDocs("payroll", []);
      addMockDocs("companies", []);
      renderWithProviders(<DashboardPage />);
      // Wait for loading to complete and dashboard to appear
      expect(
        await screen.findByRole("heading", { name: /dashboard/i }),
      ).toBeInTheDocument();
    },
  );
});
