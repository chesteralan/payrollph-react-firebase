import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DTRCalendar } from "./DTRCalendar";

vi.mock("lucide-react", () => ({
  Calendar: (props: Record<string, unknown>) => (
    <svg data-testid="icon-calendar" {...props} />
  ),
  Check: (props: Record<string, unknown>) => (
    <svg data-testid="icon-check" {...props} />
  ),
  Plus: (props: Record<string, unknown>) => (
    <svg data-testid="icon-plus" {...props} />
  ),
  X: (props: Record<string, unknown>) => (
    <svg data-testid="icon-x" {...props} />
  ),
}));

vi.mock("./DTRComputation", () => ({
  dateStr: (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
  dayStatus: () => "none",
}));

vi.mock("./DTRStatsCards", () => ({
  DTRStatsCards: ({ stats }: { stats: Record<string, number> }) => (
    <div data-testid="dtr-stats-cards">{JSON.stringify(stats)}</div>
  ),
}));

vi.mock("@/components/ui/Card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h4>{children}</h4>
  ),
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({
    children,
    onClick,
    ...rest
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: string;
    size?: string;
  }) => (
    <button onClick={onClick} {...rest}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/CalendarGrid", () => ({
  CalendarGrid: () => <div data-testid="calendar-grid" />,
}));

const defaultProps = {
  stats: {
    daysWorked: 22,
    totalHours: 176,
    totalOvertime: 12,
    totalLate: 2.5,
    totalAbsences: 3,
  },
  selectedYear: 2026,
  selectedMonth: 0,
  daysInMonth: 31,
  firstDayOfMonth: 4,
  today: new Date(2026, 0, 15),
  entryMap: new Map(),
  onDayClick: vi.fn(),
  leaveBalances: [],
  leaveApplications: [],
  benefits: [],
  onApplyLeave: vi.fn(),
  onApproveLeave: vi.fn(),
  onRejectLeave: vi.fn(),
  canEdit: true,
};

function setup(props?: Partial<typeof defaultProps>) {
  const merged = { ...defaultProps, ...props };
  merged.onDayClick = vi.fn();
  merged.onApplyLeave = vi.fn();
  merged.onApproveLeave = vi.fn();
  merged.onRejectLeave = vi.fn();
  render(<DTRCalendar {...merged} />);
  return merged;
}

describe("DTRCalendar", () => {
  it("renders stats cards", () => {
    setup();
    expect(screen.getByTestId("dtr-stats-cards")).toBeInTheDocument();
  });

  it("renders calendar grid", () => {
    setup();
    expect(screen.getByTestId("calendar-grid")).toBeInTheDocument();
  });

  it("renders Leave Management heading", () => {
    setup();
    expect(screen.getByText("Leave Management")).toBeInTheDocument();
  });

  it("shows Apply for Leave button when canEdit is true", () => {
    setup();
    expect(screen.getByText("Apply for Leave")).toBeInTheDocument();
  });

  it("hides Apply for Leave button when canEdit is false", () => {
    setup({ canEdit: false });
    expect(screen.queryByText("Apply for Leave")).not.toBeInTheDocument();
  });

  it("renders leave balances when provided", () => {
    setup({
      leaveBalances: [{ id: "b1", benefitId: "ben1", remaining: 5 } as never],
      benefits: [{ id: "ben1", name: "Vacation Leave" }],
    });
    expect(screen.getByText("Leave Balances")).toBeInTheDocument();
    expect(screen.getByText("Vacation Leave: 5")).toBeInTheDocument();
  });

  it("renders leave applications when provided", () => {
    setup({
      leaveApplications: [
        {
          id: "app1",
          benefitId: "ben1",
          startDate: "2026-01-10",
          endDate: "2026-01-12",
          status: "pending",
        } as never,
      ],
      benefits: [{ id: "ben1", name: "Sick Leave" }],
    });
    expect(screen.getByText("Leave Applications")).toBeInTheDocument();
    expect(screen.getByText("Sick Leave")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
  });
});
