import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { CompaniesPage } from "./CompaniesPage";
import { renderWithProviders } from "@/test/page-test-utils";
import { addMockDocs, clearMockDocs } from "../../../__mocks__/firebase";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("CompaniesPage", () => {
  it("renders without crashing", () => {
    addMockDocs("companies", []);
    renderWithProviders(<CompaniesPage />);
    expect(screen.getByRole("heading", { name: /companies/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add company/i })).toBeInTheDocument();
  });
});
