import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "./Input";

describe("Input", () => {
  it("should render an input element", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should render with default placeholder", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("should display the provided value", () => {
    render(<Input value="test value" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("test value");
  });

  it("should call onChange when value changes", () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "new value" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("should render label when provided", () => {
    render(<Input label="Username" />);
    expect(screen.getByText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
  });

  it("should not render label when not provided", () => {
    const { container } = render(<Input />);
    expect(container.querySelector("label")).not.toBeInTheDocument();
  });

  it("should render error message when error prop is provided", () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText("This field is required")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("should apply error styling to input when error is present", () => {
    render(<Input error="Error message" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border-red-500");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("should not apply error styling when no error", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    expect(input).not.toHaveClass("border-red-500");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("should link error message with input via aria-describedby", () => {
    render(<Input error="Error text" />);
    const input = screen.getByRole("textbox");
    const errorId = input.getAttribute("aria-describedby");
    expect(errorId).toBeTruthy();
    const errorElement = document.getElementById(errorId!);
    expect(errorElement).toHaveTextContent("Error text");
  });

  it("should disable input when disabled prop is true", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("should apply custom className", () => {
    render(<Input className="custom-input" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("custom-input");
  });

  it("should forward ref to input element", () => {
    const ref = { current: null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("should use provided id for label association", () => {
    render(<Input id="email" label="Email" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("id", "email");
  });

  it("should generate id when not provided", () => {
    render(<Input label="Name" />);
    const input = screen.getByLabelText("Name");
    expect(input).toHaveAttribute("id");
  });

  it("should set type on input element", () => {
    const { container } = render(<Input type="password" />);
    const input = container.querySelector('input[type="password"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "password");
  });

  it("should render with number type", () => {
    render(<Input type="number" />);
    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("type", "number");
  });
});
