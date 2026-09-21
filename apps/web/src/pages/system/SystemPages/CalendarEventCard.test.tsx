import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { CalendarEventCard } from "./CalendarEventCard";
import { renderWithProviders } from "@/test/page-test-utils";
import type { CalendarEvent } from "./SystemPages.types";

const mockEvent: CalendarEvent = {
  id: "ev1",
  date: new Date("2025-12-25"),
  name: "Christmas Day",
  type: "holiday",
  isPaid: true,
  recurring: true,
};

const defaultProps = {
  event: mockEvent,
  canEdit: true,
  canDelete: true,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe("CalendarEventCard", () => {
  it("renders event name and date", () => {
    renderWithProviders(<CalendarEventCard {...defaultProps} />);
    expect(screen.getByText("Christmas Day")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("shows holiday type badge", () => {
    renderWithProviders(<CalendarEventCard {...defaultProps} />);
    expect(screen.getByText("holiday")).toBeInTheDocument();
  });

  it("shows Paid label when isPaid is true", () => {
    renderWithProviders(<CalendarEventCard {...defaultProps} />);
    expect(screen.getByText(/paid/i)).toBeInTheDocument();
  });

  it("hides edit and delete when canEdit/canDelete are false", () => {
    renderWithProviders(
      <CalendarEventCard {...defaultProps} canEdit={false} canDelete={false} />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
