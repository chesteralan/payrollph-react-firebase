import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { CollectionStatsTable } from "./CollectionStatsTable";
import { renderWithProviders } from "@/test/page-test-utils";

const defaultProps = {
  stats: { names: 100, employees: 50 },
  loading: false,
  exportLoading: "",
  exportCollection: vi.fn(),
};

describe("CollectionStatsTable", () => {
  it("renders collection names and counts", () => {
    renderWithProviders(<CollectionStatsTable {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: /collection statistics/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("names")).toBeInTheDocument();
    expect(screen.getByText("employees")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    renderWithProviders(
      <CollectionStatsTable {...defaultProps} loading={true} />,
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
