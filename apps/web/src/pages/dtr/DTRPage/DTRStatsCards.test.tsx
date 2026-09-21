import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DTRStatsCards } from "./DTRStatsCards";

vi.mock("lucide-react", () => ({
  AlertCircle: (props: Record<string, unknown>) => (
    <svg data-testid="icon-alert" {...props} />
  ),
  Calendar: (props: Record<string, unknown>) => (
    <svg data-testid="icon-calendar" {...props} />
  ),
  Clock: (props: Record<string, unknown>) => (
    <svg data-testid="icon-clock" {...props} />
  ),
  Timer: (props: Record<string, unknown>) => (
    <svg data-testid="icon-timer" {...props} />
  ),
  X: (props: Record<string, unknown>) => (
    <svg data-testid="icon-x" {...props} />
  ),
}));

const defaultStats = {
  daysWorked: 22,
  totalHours: 176,
  totalOvertime: 12,
  totalLate: 2.5,
  totalAbsences: 3,
};

describe("DTRStatsCards", () => {
  it("renders all stat labels", () => {
    render(<DTRStatsCards stats={defaultStats} />);
    expect(screen.getByText("Days Worked")).toBeInTheDocument();
    expect(screen.getByText("Total Hours")).toBeInTheDocument();
    expect(screen.getByText("Overtime")).toBeInTheDocument();
    expect(screen.getByText("Late Hours")).toBeInTheDocument();
    expect(screen.getByText("Absences")).toBeInTheDocument();
  });

  it("renders correct stat values", () => {
    render(<DTRStatsCards stats={defaultStats} />);
    expect(screen.getByText("22")).toBeInTheDocument();
    expect(screen.getByText("176")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("2.5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders 5 cards", () => {
    const { container } = render(<DTRStatsCards stats={defaultStats} />);
    const cards = container.querySelectorAll("[class*='bg-white']");
    expect(cards.length).toBeGreaterThanOrEqual(5);
  });

  it("handles zero values", () => {
    const zeroStats = {
      daysWorked: 0,
      totalHours: 0,
      totalOvertime: 0,
      totalLate: 0,
      totalAbsences: 0,
    };
    render(<DTRStatsCards stats={zeroStats} />);
    expect(screen.getByText("Days Worked")).toBeInTheDocument();
  });
});
