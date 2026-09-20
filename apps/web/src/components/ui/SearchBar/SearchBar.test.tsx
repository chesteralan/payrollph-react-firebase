import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render with default placeholder", () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("should render with custom placeholder", () => {
    render(<SearchBar value="" onChange={vi.fn()} placeholder="Find..." />);
    expect(screen.getByPlaceholderText("Find...")).toBeInTheDocument();
  });

  it("should display the provided value", () => {
    render(<SearchBar value="initial" onChange={vi.fn()} />);
    // Input with type="text" has role "textbox", not "searchbox"
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("initial");
  });

  it("should update local value on input change", () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });
    expect(input).toHaveValue("test");
  });

  it("should debounce onChange calls", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} debounceMs={300} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "t" } });
    fireEvent.change(input, { target: { value: "te" } });
    fireEvent.change(input, { target: { value: "tes" } });
    fireEvent.change(input, { target: { value: "test" } });

    // Not called yet because debounce hasn't fired
    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("test");
  });

  it("should debounce with custom debounceMs", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} debounceMs={500} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onChange).toHaveBeenCalledWith("test");
  });

  it("should show clear button when input has value", () => {
    render(<SearchBar value="test" onChange={vi.fn()} />);
    expect(screen.getByLabelText("Clear search")).toBeInTheDocument();
  });

  it("should not show clear button when input is empty", () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
  });

  it("should clear input and call onChange with empty string on clear", () => {
    const onChange = vi.fn();
    render(<SearchBar value="test" onChange={onChange} />);

    fireEvent.click(screen.getByLabelText("Clear search"));
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("");
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("should sync with external value changes", () => {
    const { rerender } = render(
      <SearchBar value="initial" onChange={vi.fn()} />,
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("initial");

    rerender(<SearchBar value="updated" onChange={vi.fn()} />);
    expect(input).toHaveValue("updated");
  });

  it("should apply custom className", () => {
    const { container } = render(
      <SearchBar value="" onChange={vi.fn()} className="custom-class" />,
    );
    const searchDiv = container.firstChild as HTMLElement;
    expect(searchDiv.classList.contains("custom-class")).toBe(true);
  });

  it("should render with search role", () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.getByRole("search")).toBeInTheDocument();
  });

  it("should reset debounce timer on rapid typing", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} debounceMs={300} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "t" } });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    fireEvent.change(input, { target: { value: "te" } });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Should not have fired yet because timer was reset
    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("te");
  });
});
