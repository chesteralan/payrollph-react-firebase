import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { PayrollSummaryPage } from "./PayrollSummaryPage";
import { renderWithProviders } from "@/test/page-test-utils";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PayrollSummaryPage", () => {
  it("renders without crashing and shows the heading", () => {
    renderWithProviders(<PayrollSummaryPage />);
    expect(screen.getByText("Payroll Summary Report")).toBeInTheDocument();
  });
});
