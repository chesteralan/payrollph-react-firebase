import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Stepper } from "./Stepper";
import type { Step } from "./Stepper.types";

const makeSteps = (overrides?: Partial<Step>): Step[] => [
  { label: "Step 1", completed: true, active: false, ...overrides },
  { label: "Step 2", completed: false, active: true, ...overrides },
  { label: "Step 3", completed: false, active: false, ...overrides },
];

describe("Stepper", () => {
  it("renders all steps", () => {
    render(<Stepper steps={makeSteps()} />);
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Step 2")).toBeInTheDocument();
    expect(screen.getByText("Step 3")).toBeInTheDocument();
  });

  it("shows progress bar with correct percentage", () => {
    render(<Stepper steps={makeSteps()} />);
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-valuenow", "33");
    expect(screen.getByText("33%")).toBeInTheDocument();
  });

  it("shows 100% when all steps completed", () => {
    const steps: Step[] = [
      { label: "A", completed: true, active: false },
      { label: "B", completed: true, active: false },
    ];
    render(<Stepper steps={steps} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("renders step descriptions when provided", () => {
    const steps: Step[] = [
      { label: "First", completed: false, active: true, description: "Desc 1" },
    ];
    render(<Stepper steps={steps} />);
    expect(screen.getByText("Desc 1")).toBeInTheDocument();
  });

  it("calls onStepClick when clicking a completed step", () => {
    const handleClick = vi.fn();
    const steps: Step[] = [
      { label: "Done", completed: true, active: false },
      { label: "Current", completed: false, active: true },
    ];
    render(<Stepper steps={steps} onStepClick={handleClick} />);
    fireEvent.click(screen.getByRole("button", { name: /Step 1: Done/i }));
    expect(handleClick).toHaveBeenCalledWith(0);
  });

  it("does not call onStepClick for non-completed step", () => {
    const handleClick = vi.fn();
    const steps: Step[] = [
      { label: "Done", completed: true, active: false },
      { label: "Pending", completed: false, active: true },
    ];
    render(<Stepper steps={steps} onStepClick={handleClick} />);
    fireEvent.click(screen.getByRole("button", { name: /Step 2: Pending/i }));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("disables step buttons when onStepClick is not provided", () => {
    const steps: Step[] = [{ label: "Done", completed: true, active: false }];
    render(<Stepper steps={steps} />);
    const button = screen.getByRole("button", { name: /Step 1: Done/i });
    expect(button).toBeDisabled();
  });

  it("has accessible list and listitem roles", () => {
    render(<Stepper steps={makeSteps()} />);
    expect(
      screen.getByRole("list", { name: "Progress steps" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("sets aria-current on active step", () => {
    render(<Stepper steps={makeSteps()} />);
    const activeButton = screen.getByRole("button", {
      name: /Step 2: Step 2/i,
    });
    expect(activeButton).toHaveAttribute("aria-current", "step");
  });
});
