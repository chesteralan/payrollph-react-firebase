import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { EmployeeCalendarPage } from "./CalendarPage";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EmployeeCalendarPage", () => {
  it("renders without crashing and shows the heading", () => {
    render(
      <MemoryRouter>
        <EmployeeCalendarPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Employee Calendar")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(
      <MemoryRouter>
        <EmployeeCalendarPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByText("Calendar view for attendance and scheduling."),
    ).toBeInTheDocument();
  });
});
