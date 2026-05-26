import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { BenefitsUtilizationReportPage } from "./BenefitsUtilizationReportPage";
import { renderWithProviders } from "@/test/page-test-utils";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("BenefitsUtilizationReportPage", () => {
  it("renders without crashing", () => {
    renderWithProviders(<BenefitsUtilizationReportPage />);
    expect(screen.getByText("Benefits Utilization Report")).toBeInTheDocument();
  });
});
