import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { YearEndReportPage } from "./YearEndReportPage";
import { renderWithProviders } from "@/test/page-test-utils";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("YearEndReportPage", () => {
  it("renders without crashing", () => {
    renderWithProviders(<YearEndReportPage />);
    expect(screen.getByText("Year-End Report")).toBeInTheDocument();
  });
});
