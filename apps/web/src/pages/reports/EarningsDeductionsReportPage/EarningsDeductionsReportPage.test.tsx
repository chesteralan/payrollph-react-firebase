import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { EarningsDeductionsReportPage } from "./EarningsDeductionsReportPage";
import { renderWithProviders } from "@/test/page-test-utils";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EarningsDeductionsReportPage", () => {
  it("renders without crashing", async () => {
    renderWithProviders(<EarningsDeductionsReportPage />);
    expect(
      await screen.findByText("Earnings/Deductions Breakdown Report"),
    ).toBeInTheDocument();
  });
});
