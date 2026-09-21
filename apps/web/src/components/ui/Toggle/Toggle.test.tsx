import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Toggle } from "./Toggle";

describe("Toggle", () => {
  it("should render as a switch button", () => {
    render(<Toggle checked={false} onChange={vi.fn()} />);
    const toggle = screen.getByRole("switch");
    expect(toggle).toBeInTheDocument();
  });

  it("should render unchecked by default", () => {
    render(<Toggle checked={false} onChange={vi.fn()} />);
    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("should render checked when checked is true", () => {
    render(<Toggle checked={true} onChange={vi.fn()} />);
    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("should display label when provided", () => {
    render(<Toggle checked={false} onChange={vi.fn()} label="Enable feature" />);
    expect(screen.getByText("Enable feature")).toBeInTheDocument();
  });

  it("should not display label when not provided", () => {
    const { container } = render(<Toggle checked={false} onChange={vi.fn()} />);
    const label = container.querySelector("span.text-sm");
    expect(label).not.toBeInTheDocument();
  });

  it("should call onChange with opposite value on click", () => {
    const handleChange = vi.fn();
    render(<Toggle checked={false} onChange={handleChange} />);

    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("should call onChange with false when toggling from checked", () => {
    const handleChange = vi.fn();
    render(<Toggle checked={true} onChange={handleChange} />);

    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);

    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Toggle checked={false} onChange={vi.fn()} disabled />);
    const toggle = screen.getByRole("switch");
    expect(toggle).toBeDisabled();
  });

  it("should not call onChange when disabled", () => {
    const handleChange = vi.fn();
    render(<Toggle checked={false} onChange={handleChange} disabled />);

    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);

    expect(handleChange).not.toHaveBeenCalled();
  });

  it("should apply custom className", () => {
    render(<Toggle checked={false} onChange={vi.fn()} className="custom-class" />);
    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveClass("custom-class");
  });

  it("should apply disabled styling to label", () => {
    const { container } = render(
      <Toggle checked={false} onChange={vi.fn()} disabled />,
    );
    const label = container.querySelector("label");
    expect(label).toHaveClass("opacity-50", "cursor-not-allowed");
  });

  it("should forward ref", () => {
    const ref = { current: null };
    render(<Toggle checked={false} onChange={vi.fn()} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("should apply checked background color", () => {
    render(<Toggle checked={true} onChange={vi.fn()} />);
    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveClass("bg-primary-600");
  });

  it("should apply unchecked background color", () => {
    render(<Toggle checked={false} onChange={vi.fn()} />);
    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveClass("bg-gray-200");
  });

  it("should have correct type attribute", () => {
    render(<Toggle checked={false} onChange={vi.fn()} />);
    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("type", "button");
  });
});
