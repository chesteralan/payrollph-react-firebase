import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { VerificationResultsTable } from "./VerificationResultsTable";
import { renderWithProviders } from "@/test/page-test-utils";

const defaultProps = {
  results: [],
  verifying: false,
  onRunVerification: vi.fn(),
};

describe("VerificationResultsTable", () => {
  it("renders the database verification heading", () => {
    renderWithProviders(<VerificationResultsTable {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: /database verification/i }),
    ).toBeInTheDocument();
  });

  it("renders the run verification button", () => {
    renderWithProviders(<VerificationResultsTable {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /run verification/i }),
    ).toBeInTheDocument();
  });

  it("shows prompt when no results", () => {
    renderWithProviders(<VerificationResultsTable {...defaultProps} />);
    expect(screen.getByText(/click "run verification"/i)).toBeInTheDocument();
  });

  it("displays results when provided", () => {
    const results = [
      {
        name: "Check Users",
        status: "Pass" as const,
        details: "All users valid",
        issueCount: 0,
      },
    ];
    renderWithProviders(
      <VerificationResultsTable {...defaultProps} results={results} />,
    );
    expect(screen.getByText("Check Users")).toBeInTheDocument();
    expect(screen.getByText("All users valid")).toBeInTheDocument();
    expect(screen.getByText("Pass")).toBeInTheDocument();
  });

  it("disables button when verifying", () => {
    renderWithProviders(
      <VerificationResultsTable {...defaultProps} verifying={true} />,
    );
    expect(screen.getByRole("button", { name: /verifying/i })).toBeDisabled();
  });
});
