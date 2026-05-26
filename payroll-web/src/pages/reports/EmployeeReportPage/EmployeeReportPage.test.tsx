import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { EmployeeReportPage } from "./EmployeeReportPage";
import { renderWithProviders } from "@/test/page-test-utils";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EmployeeReportPage", () => {
  it("renders without crashing and shows the heading", () => {
    renderWithProviders(<EmployeeReportPage />);
    expect(screen.getByText("Employee Master List Report")).toBeInTheDocument();
  });
});
