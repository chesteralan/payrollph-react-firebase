import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditableCell } from "./EditableCell";

describe("EditableCell", () => {
  it("renders the value as text", () => {
    render(<EditableCell value="Hello" onChange={vi.fn()} />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("formats number values with locale string", () => {
    render(<EditableCell value={1234.5} type="number" onChange={vi.fn()} />);
    expect(screen.getByText("1,234.50")).toBeInTheDocument();
  });

  it("enters edit mode on click", () => {
    render(<EditableCell value="Edit me" onChange={vi.fn()} />);
    fireEvent.click(screen.getByText("Edit me"));
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("Edit me");
  });

  it("enters edit mode on Enter key", () => {
    render(<EditableCell value="Press Enter" onChange={vi.fn()} />);
    const cell = screen.getByRole("button");
    fireEvent.keyDown(cell, { key: "Enter" });
    expect(screen.getByRole("textbox")).toHaveValue("Press Enter");
  });

  it("enters edit mode on Space key", () => {
    render(<EditableCell value="Press Space" onChange={vi.fn()} />);
    const cell = screen.getByRole("button");
    fireEvent.keyDown(cell, { key: " " });
    expect(screen.getByRole("textbox")).toHaveValue("Press Space");
  });

  it("calls onChange on blur", () => {
    const onChange = vi.fn();
    render(<EditableCell value="old" onChange={onChange} />);
    fireEvent.click(screen.getByText("old"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "new" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith("new");
  });

  it("calls onChange on Enter", () => {
    const onChange = vi.fn();
    render(<EditableCell value="old" onChange={onChange} />);
    fireEvent.click(screen.getByText("old"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "new" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("new");
  });

  it("reverts value on Escape", () => {
    const onChange = vi.fn();
    render(<EditableCell value="original" onChange={onChange} />);
    fireEvent.click(screen.getByText("original"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "changed" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("original")).toBeInTheDocument();
  });

  it("shows highlight after value changes", () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <EditableCell value="a" originalValue="a" onChange={vi.fn()} />,
    );
    rerender(<EditableCell value="b" originalValue="a" onChange={vi.fn()} />);
    const cell = screen.getByText("b");
    expect(cell.className).toContain("bg-yellow-100");
    vi.useRealTimers();
  });

  it("applies custom className", () => {
    render(
      <EditableCell value="test" onChange={vi.fn()} className="my-class" />,
    );
    expect(screen.getByText("test").className).toContain("my-class");
  });

  it("has accessible aria-label for text type", () => {
    render(<EditableCell value="Name" onChange={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Edit value: Name",
    );
  });

  it("has accessible aria-label for number type", () => {
    render(<EditableCell value={100} type="number" onChange={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Edit value: 100.00",
    );
  });
});
