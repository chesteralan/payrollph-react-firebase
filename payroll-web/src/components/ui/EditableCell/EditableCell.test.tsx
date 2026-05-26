import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditableCell } from "./EditableCell";

describe("EditableCell", () => {
  it("should display text value in view mode", () => {
    render(<EditableCell value="John Doe" onChange={vi.fn()} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should display number value formatted in view mode", () => {
    render(<EditableCell value={5000} onChange={vi.fn()} type="number" />);
    expect(screen.getByText("5,000.00")).toBeInTheDocument();
  });

  it("should enter edit mode on click", () => {
    render(<EditableCell value="Editable" onChange={vi.fn()} />);
    fireEvent.click(screen.getByText("Editable"));
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("Editable");
  });

  it("should enter edit mode on Enter key press", () => {
    render(<EditableCell value="Cell" onChange={vi.fn()} />);
    const cell = screen.getByText("Cell");
    fireEvent.keyDown(cell, { key: "Enter" });
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should enter edit mode on Space key press", () => {
    render(<EditableCell value="Cell" onChange={vi.fn()} />);
    const cell = screen.getByText("Cell");
    fireEvent.keyDown(cell, { key: " " });
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should commit changes on Enter key in edit mode", () => {
    const onChange = vi.fn();
    render(<EditableCell value="Old" onChange={onChange} />);
    fireEvent.click(screen.getByText("Old"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "New" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("New");
  });

  it("should cancel changes on Escape key in edit mode", () => {
    const onChange = vi.fn();
    render(<EditableCell value="Original" onChange={onChange} />);
    fireEvent.click(screen.getByText("Original"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Changed" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onChange).not.toHaveBeenCalled();
    // Should revert to original value in view mode
    expect(screen.getByText("Original")).toBeInTheDocument();
  });

  it("should commit changes on blur", () => {
    const onChange = vi.fn();
    render(<EditableCell value="Initial" onChange={onChange} />);
    fireEvent.click(screen.getByText("Initial"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Blurred" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith("Blurred");
  });

  it("should format number input correctly on commit", () => {
    const onChange = vi.fn();
    render(<EditableCell value={1000} onChange={onChange} type="number" />);
    fireEvent.click(screen.getByText("1,000.00"));
    // Number type inputs use spinbutton role, not textbox
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "2500" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("2500");
  });

  it("should render with button role in view mode", () => {
    render(<EditableCell value="Test" onChange={vi.fn()} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should render with tabIndex=0 in view mode", () => {
    render(<EditableCell value="Test" onChange={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveAttribute("tabindex", "0");
  });

  it("should apply custom className in view mode", () => {
    render(
      <EditableCell
        value="Styled"
        onChange={vi.fn()}
        className="custom-class"
      />,
    );
    const cell = screen.getByText("Styled");
    expect(cell.classList.contains("custom-class")).toBe(true);
  });

  it("should auto-focus input when entering edit mode", () => {
    render(<EditableCell value="AutoFocus" onChange={vi.fn()} />);
    fireEvent.click(screen.getByText("AutoFocus"));
    const input = screen.getByRole("textbox");
    expect(document.activeElement).toBe(input);
  });

  it("should render number type input in edit mode", () => {
    render(<EditableCell value={500} onChange={vi.fn()} type="number" />);
    fireEvent.click(screen.getByText("500.00"));
    const input = screen.getByRole("spinbutton");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "number");
  });
});
