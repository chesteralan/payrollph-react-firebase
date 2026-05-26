import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { PayrollRunsPage } from "./PayrollRunsPage";
import { renderWithProviders } from "@/test/page-test-utils";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PayrollRunsPage", () => {
  it("renders without crashing and shows the heading", () => {
    renderWithProviders(<PayrollRunsPage />);
    expect(screen.getByText("Payroll Runs")).toBeInTheDocument();
  });

  it("renders the search input and filter", () => {
    renderWithProviders(<PayrollRunsPage />);
    expect(screen.getByPlaceholderText("Search payrolls...")).toBeInTheDocument();
    expect(screen.getByText("All Status")).toBeInTheDocument();
  });

  it("renders filter options", () => {
    renderWithProviders(<PayrollRunsPage />);
    const select = screen.getByText("All Status");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Locked")).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
  });
});
