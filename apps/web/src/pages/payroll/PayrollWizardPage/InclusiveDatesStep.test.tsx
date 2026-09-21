import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InclusiveDatesStep } from "./InclusiveDatesStep";

const defaultProps = {
  errors: {},
  dateStr: "",
  onDateStrChange: vi.fn(),
  inclusiveDates: [],
  onAddDate: vi.fn(),
  onRemoveDate: vi.fn(),
  onNext: vi.fn(),
  onBack: vi.fn(),
  loading: false,
};

describe("InclusiveDatesStep", () => {
  it("renders the heading", () => {
    render(<InclusiveDatesStep {...defaultProps} />);
    expect(screen.getByText("Inclusive Dates")).toBeTruthy();
  });

  it("renders the date input", () => {
    render(<InclusiveDatesStep {...defaultProps} />);
    expect(document.getElementById("date")).toBeTruthy();
  });

  it("displays error message when errors.dates is set", () => {
    render(
      <InclusiveDatesStep
        {...defaultProps}
        errors={{ dates: "At least one date is required" }}
      />,
    );
    expect(screen.getByText("At least one date is required")).toBeTruthy();
  });

  it("shows date chips when inclusiveDates has items", () => {
    const dates = [new Date("2026-01-15"), new Date("2026-01-20")];
    render(<InclusiveDatesStep {...defaultProps} inclusiveDates={dates} />);
    expect(screen.getByText("1/15/2026")).toBeTruthy();
    expect(screen.getByText("1/20/2026")).toBeTruthy();
  });

  it("calls onAddDate when Add Date is clicked", () => {
    const onAddDate = vi.fn();
    render(
      <InclusiveDatesStep
        {...defaultProps}
        dateStr="2026-01-15"
        onAddDate={onAddDate}
      />,
    );
    fireEvent.click(screen.getByText("Add Date"));
    expect(onAddDate).toHaveBeenCalled();
  });

  it("disables Add Date button when dateStr is empty", () => {
    render(<InclusiveDatesStep {...defaultProps} />);
    expect(screen.getByText("Add Date").closest("button")).toBeDisabled();
  });

  it("calls onNext when Next is clicked", () => {
    const onNext = vi.fn();
    const dates = [new Date("2026-01-15")];
    render(
      <InclusiveDatesStep
        {...defaultProps}
        inclusiveDates={dates}
        onNext={onNext}
      />,
    );
    fireEvent.click(screen.getByText("Next"));
    expect(onNext).toHaveBeenCalled();
  });

  it("disables Next button when no dates", () => {
    render(<InclusiveDatesStep {...defaultProps} />);
    expect(screen.getByText("Next").closest("button")).toBeDisabled();
  });

  it("disables Next button when loading", () => {
    const dates = [new Date("2026-01-15")];
    render(
      <InclusiveDatesStep
        {...defaultProps}
        inclusiveDates={dates}
        loading={true}
      />,
    );
    expect(screen.getByText("Next").closest("button")).toBeDisabled();
  });

  it("calls onBack when Back is clicked", () => {
    const onBack = vi.fn();
    render(<InclusiveDatesStep {...defaultProps} onBack={onBack} />);
    fireEvent.click(screen.getByText("Back"));
    expect(onBack).toHaveBeenCalled();
  });

  it("calls onRemoveDate when a date chip remove button is clicked", () => {
    const onRemoveDate = vi.fn();
    const dates = [new Date("2026-01-15")];
    render(
      <InclusiveDatesStep
        {...defaultProps}
        inclusiveDates={dates}
        onRemoveDate={onRemoveDate}
      />,
    );
    const chips = document.querySelectorAll(".bg-primary-50 button");
    if (chips.length > 0) fireEvent.click(chips[0]);
    expect(onRemoveDate).toHaveBeenCalledWith(0);
  });
});
