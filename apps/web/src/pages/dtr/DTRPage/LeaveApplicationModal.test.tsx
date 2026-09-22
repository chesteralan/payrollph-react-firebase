import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LeaveApplicationModal } from "./LeaveApplicationModal";
import type { DTRPageLeaveForm, DTRPageBenefit } from "./DTRPage.types";

const benefits: DTRPageBenefit[] = [
  { id: "vacation", name: "Vacation Leave" },
  { id: "sick", name: "Sick Leave" },
];

const defaultForm: DTRPageLeaveForm = {
  benefitId: "",
  startDate: "",
  endDate: "",
  reason: "",
};

const defaultProps = {
  show: true,
  leaveForm: defaultForm,
  benefits,
  onClose: vi.fn(),
  onChange: vi.fn(),
  onSubmit: vi.fn(),
};

function setup(props?: Partial<typeof defaultProps>) {
  const merged = { ...defaultProps, ...props };
  merged.onClose = vi.fn();
  merged.onChange = vi.fn();
  merged.onSubmit = vi.fn();
  render(<LeaveApplicationModal {...merged} />);
  return merged;
}

describe("LeaveApplicationModal", () => {
  it("does not render when show is false", () => {
    setup({ show: false });
    expect(screen.queryByText("Apply for Leave")).not.toBeInTheDocument();
  });

  it("renders the modal title", () => {
    setup();
    expect(screen.getByText("Apply for Leave")).toBeInTheDocument();
  });

  it("renders Leave Type select with benefits", () => {
    setup();
    expect(screen.getByText("Vacation Leave")).toBeInTheDocument();
    expect(screen.getByText("Sick Leave")).toBeInTheDocument();
  });

  it("renders start and end date inputs", () => {
    setup();
    expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
    expect(screen.getByLabelText("End Date")).toBeInTheDocument();
  });

  it("renders reason input", () => {
    setup();
    expect(screen.getByLabelText("Reason")).toBeInTheDocument();
  });

  it("displays total days when both dates are provided", () => {
    setup({
      leaveForm: { benefitId: "vacation", startDate: "2025-01-15", endDate: "2025-01-17", reason: "" },
    });
    expect(screen.getByText("Total Days:")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("hides total days when dates are empty", () => {
    setup();
    expect(screen.queryByText("Total Days:")).not.toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", () => {
    const merged = setup();
    fireEvent.click(screen.getByText("Cancel"));
    expect(merged.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onSubmit when Submit Application is clicked", () => {
    const merged = setup();
    fireEvent.click(screen.getByText("Submit Application"));
    expect(merged.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    const merged = setup();
    const backdrop = document.querySelector(".fixed.inset-0.bg-black\\/50");
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);
    expect(merged.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onChange when leave type is changed", () => {
    const merged = setup();
    fireEvent.change(screen.getByDisplayValue("Select leave type"), {
      target: { value: "vacation" },
    });
    expect(merged.onChange).toHaveBeenCalled();
  });
});
