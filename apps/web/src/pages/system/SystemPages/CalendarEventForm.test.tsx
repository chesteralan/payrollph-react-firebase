import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { CalendarEventForm } from "./CalendarEventForm";
import { renderWithProviders } from "@/test/page-test-utils";
import type { CalendarFormData } from "./useCalendarPage";

const defaultFormData: CalendarFormData = {
  date: "2025-12-25",
  name: "Christmas",
  type: "holiday",
  isPaid: true,
};

const defaultProps = {
  formData: defaultFormData,
  editingId: null,
  onFormDataChange: vi.fn(),
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
};

describe("CalendarEventForm", () => {
  it("renders Add form when not editing", () => {
    renderWithProviders(<CalendarEventForm {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: /add calendar entry/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create/i })).toBeInTheDocument();
  });

  it("renders Edit form when editingId is set", () => {
    renderWithProviders(
      <CalendarEventForm {...defaultProps} editingId="ev1" />,
    );
    expect(
      screen.getByRole("heading", { name: /edit calendar entry/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update/i })).toBeInTheDocument();
  });

  it("displays form field values", () => {
    renderWithProviders(<CalendarEventForm {...defaultProps} />);
    expect(screen.getByDisplayValue("2025-12-25")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Christmas")).toBeInTheDocument();
  });
});
