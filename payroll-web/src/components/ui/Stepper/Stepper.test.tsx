import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Stepper } from "./Stepper";

describe("Stepper", () => {
  const defaultSteps = [
    { label: "Personal Info", completed: true, active: false },
    { label: "Employment", completed: false, active: true },
    { label: "Documents", completed: false, active: false },
    { label: "Review", completed: false, active: false },
  ];

  it("should render all steps", () => {
    render(<Stepper steps={defaultSteps} />);
    expect(screen.getByText("Personal Info")).toBeInTheDocument();
    expect(screen.getByText("Employment")).toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
  });

  it("should render with list role", () => {
    render(<Stepper steps={defaultSteps} />);
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("should render each step as listitem", () => {
    render(<Stepper steps={defaultSteps} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
  });

  it("should mark completed steps with check icon", () => {
    render(<Stepper steps={defaultSteps} />);
    const completedLabel = screen.getByLabelText(
      "Step 1: Personal Info (completed)",
    );
    expect(completedLabel).toBeInTheDocument();
    expect(completedLabel).toContainHTML("svg");
  });

  it("should mark active step with correct aria-current", () => {
    render(<Stepper steps={defaultSteps} />);
    const activeStep = screen.getByLabelText("Step 2: Employment");
    expect(activeStep).toHaveAttribute("aria-current", "step");
  });

  it("should render step numbers for incomplete steps", () => {
    const steps = [
      { label: "Step 1", completed: false, active: true },
      { label: "Step 2", completed: false, active: false },
    ];
    render(<Stepper steps={steps} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("should render all completed steps", () => {
    const completedSteps = [
      { label: "Done", completed: true, active: false },
      { label: "Done 2", completed: true, active: false },
    ];
    render(<Stepper steps={completedSteps} />);
    expect(
      screen.getByLabelText("Step 1: Done (completed)"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Step 2: Done 2 (completed)"),
    ).toBeInTheDocument();
  });

  it("should render connectors between steps", () => {
    const { container } = render(<Stepper steps={defaultSteps} />);
    // The connector divs have class "flex-1 h-0.5 mx-4"
    const connectors = container.querySelectorAll(
      '[class*="h-0"][class*="mx-4"]',
    );
    expect(connectors.length).toBe(3); // 4 steps → 3 connectors
  });

  it("should use gray connector when next step is not completed", () => {
    const steps = [
      { label: "Active", completed: false, active: true },
      { label: "Pending", completed: false, active: false },
    ];
    const { container } = render(<Stepper steps={steps} />);
    // The connector checks steps[i + 1].completed - next step is not completed
    const connectors = container.querySelectorAll('[class*="bg-gray-200"]');
    expect(connectors.length).toBeGreaterThanOrEqual(1);
  });

  it("should render disabled step styling", () => {
    const steps = [
      { label: "Active", completed: false, active: true },
      { label: "Disabled", completed: false, active: false },
    ];
    render(<Stepper steps={steps} />);
    const disabledStep = screen.getByLabelText("Step 2: Disabled");
    expect(disabledStep).toBeInTheDocument();
  });

  it("should render with aria-label on the container", () => {
    render(<Stepper steps={defaultSteps} />);
    expect(screen.getByLabelText("Progress steps")).toBeInTheDocument();
  });

  it("should handle a single step", () => {
    const singleStep = [{ label: "Only Step", completed: false, active: true }];
    const { container } = render(<Stepper steps={singleStep} />);
    expect(screen.getByText("Only Step")).toBeInTheDocument();
    // No connectors when only one step
    const connectors = container.querySelectorAll(
      '[class*="h-0"][class*="mx-4"]',
    );
    expect(connectors.length).toBe(0);
  });
});
