import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { DataCleanupSection } from "./DataCleanupSection";
import { renderWithProviders } from "@/test/page-test-utils";
import type { CleanupResult } from "./DatabasePage.types";

const defaultProps = {
  dtrMonths: 6,
  onDtrMonthsChange: vi.fn(),
  softDeleteDays: 30,
  onSoftDeleteDaysChange: vi.fn(),
  archiveYears: 2,
  onArchiveYearsChange: vi.fn(),
  runCleanup: vi.fn(),
  cleanupLoading: "",
  cleanupResults: [] as CleanupResult[],
};

describe("DataCleanupSection", () => {
  it("renders without crashing", () => {
    renderWithProviders(<DataCleanupSection {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: /data cleanup/i }),
    ).toBeInTheDocument();
  });

  it("shows cleanup operation buttons", () => {
    renderWithProviders(<DataCleanupSection {...defaultProps} />);
    expect(screen.getByText(/remove orphaned records/i)).toBeInTheDocument();
    expect(screen.getByText(/remove duplicate names/i)).toBeInTheDocument();
    expect(screen.getByText(/clear old dtr entries/i)).toBeInTheDocument();
  });

  it("shows cleanup history when results exist", () => {
    const results: CleanupResult[] = [
      { name: "orphaned", count: 5, time: 120, success: true },
    ];
    renderWithProviders(
      <DataCleanupSection {...defaultProps} cleanupResults={results} />,
    );
    expect(screen.getByText(/cleanup history/i)).toBeInTheDocument();
    expect(screen.getByText("orphaned")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });
});
