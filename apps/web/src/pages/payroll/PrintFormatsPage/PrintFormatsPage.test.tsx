import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { PrintFormatsPage } from "./PrintFormatsPage";
import { renderWithProviders } from "@/test/page-test-utils";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PrintFormatsPage", () => {
  it("renders without crashing and shows the heading", () => {
    renderWithProviders(<PrintFormatsPage />);
    expect(screen.getByText("Print Format Templates")).toBeInTheDocument();
  });

  it("renders the description", () => {
    renderWithProviders(<PrintFormatsPage />);
    expect(
      screen.getByText("Configure print layouts for payroll output views"),
    ).toBeInTheDocument();
  });

  it("renders the New Print Format button", () => {
    renderWithProviders(<PrintFormatsPage />);
    expect(screen.getByText("New Print Format")).toBeInTheDocument();
  });
});
