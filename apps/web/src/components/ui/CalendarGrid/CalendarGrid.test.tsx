import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CalendarGrid } from "./CalendarGrid";
import { DAY_NAMES } from "./constants";

describe("CalendarGrid", () => {
  const baseProps = {
    year: 2026,
    month: 0,
    firstDayOfMonth: 5,
    daysInMonth: 31,
  };

  it("renders day-of-week headers", () => {
    render(<CalendarGrid {...baseProps} />);
    for (const name of DAY_NAMES) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("renders the correct number of day cells", () => {
    const { container } = render(<CalendarGrid {...baseProps} />);
    const grid = container.firstChild as HTMLElement;
    // 7 headers + 5 leading empties + 31 day cells = 43
    expect(grid.children.length).toBe(43);
  });

  it("renders empty placeholders before first day", () => {
    const { container } = render(<CalendarGrid {...baseProps} />);
    const grid = container.firstChild as HTMLElement;
    for (let i = 0; i < 5; i++) {
      expect(grid.children[7 + i].textContent).toBe("");
    }
  });

  it("applies today ring when today matches", () => {
    const today = new Date(2026, 0, 15);
    render(<CalendarGrid {...baseProps} today={today} />);
    const span = screen.getByText("15");
    expect(span.parentElement).toHaveClass("ring-2");
  });

  it("does not apply today ring to other days", () => {
    const today = new Date(2026, 0, 15);
    render(<CalendarGrid {...baseProps} today={today} />);
    const span = screen.getByText("14");
    expect(span.parentElement).not.toHaveClass("ring-2");
  });

  it("calls renderDay for each day", () => {
    const renderDay = (day: number, isToday: boolean) => (
      <div key={day} data-testid={`day-${day}`}>
        {isToday ? "T" : "X"}
        {day}
      </div>
    );
    render(<CalendarGrid {...baseProps} renderDay={renderDay} />);
    expect(screen.getByTestId("day-1")).toHaveTextContent("X1");
    expect(screen.getByTestId("day-31")).toHaveTextContent("X31");
  });

  it("calls renderDayHeader for each header", () => {
    const renderDayHeader = (name: string) => (
      <div key={name} data-testid={`header-${name}`}>
        {name.toUpperCase()}
      </div>
    );
    render(<CalendarGrid {...baseProps} renderDayHeader={renderDayHeader} />);
    expect(screen.getByTestId("header-Sun")).toHaveTextContent("SUN");
  });

  it("applies custom className", () => {
    const { container } = render(
      <CalendarGrid {...baseProps} className="extra-class" />,
    );
    expect((container.firstChild as HTMLElement).className).toContain(
      "extra-class",
    );
  });
});
