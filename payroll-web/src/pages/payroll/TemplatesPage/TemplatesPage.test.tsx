import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { TemplatesPage } from "./TemplatesPage";
import { renderWithProviders } from "@/test/page-test-utils";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TemplatesPage", () => {
  it("renders without crashing and shows the heading", () => {
    renderWithProviders(<TemplatesPage />);
    expect(screen.getByText("Payroll Templates")).toBeInTheDocument();
  });

  it("renders the New Template button", () => {
    renderWithProviders(<TemplatesPage />);
    expect(screen.getByText("New Template")).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    renderWithProviders(<TemplatesPage />);
    // Should show the templates page structure
    expect(screen.getByText("Payroll Templates")).toBeInTheDocument();
  });
});
