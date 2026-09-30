import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { RecurringHolidayForm } from "./RecurringHolidayForm";
import { renderWithProviders } from "@/test/page-test-utils";
import type { RecurringFormData } from "./useCalendarPage";

const defaultProps = {
  formData: {
    month: 1,
    day: 1,
    name: "New Year",
    type: "holiday" as const,
    isPaid: true,
    years: 1,
  } satisfies RecurringFormData,
  onFormDataChange: vi.fn(),
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
};

describe("RecurringHolidayForm", () => {
  it("renders form with heading and fields", () => {
    renderWithProviders(<RecurringHolidayForm {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: /create recurring holiday/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/holiday name/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create recurring holiday/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("displays the provided form values", () => {
    renderWithProviders(<RecurringHolidayForm {...defaultProps} />);
    expect(screen.getByLabelText(/holiday name/i)).toHaveValue("New Year");
  });

  it("renders form fields and dropdowns", () => {
    renderWithProviders(<RecurringHolidayForm {...defaultProps} />);
    expect(screen.getByLabelText(/paid holiday/i)).toBeInTheDocument();
  });
});
