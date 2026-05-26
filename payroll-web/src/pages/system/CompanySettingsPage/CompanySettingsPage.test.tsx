import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { CompanySettingsPage } from "./CompanySettingsPage";
import { renderWithProviders, createMockCompanyContextValue } from "@/test/page-test-utils";
import { addMockDocs, clearMockDocs } from "../../../__mocks__/firebase";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("CompanySettingsPage", () => {
  it("renders without crashing and shows the heading after loading", async () => {
    addMockDocs("company_settings/company-1", [
      {
        id: "company_settings/company-1",
        companyId: "company-1",
        theme: "light",
        itemsPerPage: 25,
      },
    ]);

    addMockDocs("companies", [
      { id: "company-1", name: "Test Company", isActive: true },
    ]);

    const companyValue = createMockCompanyContextValue({
      selectedCompany: { id: "company-1", name: "Test Company", isActive: true, createdAt: new Date(), updatedAt: new Date() },
    });

    renderWithProviders(<CompanySettingsPage />, { companyValue });
    expect(await screen.findByRole("heading", { name: /company settings/i })).toBeInTheDocument();
  });
});
