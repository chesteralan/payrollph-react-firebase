import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchBar } from "./SearchBar";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SearchBar", () => {
  it("renders input with placeholder", () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("renders custom placeholder", () => {
    render(<SearchBar value="" onChange={vi.fn()} placeholder="Find..." />);
    expect(screen.getByPlaceholderText("Find...")).toBeInTheDocument();
  });

  it("displays the controlled value", () => {
    render(<SearchBar value="hello" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveValue("hello");
  });

  it("calls onChange after debounce", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} debounceMs={300} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "test" },
    });

    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledWith("test");
  });

  it("shows clear button when input has value", () => {
    render(<SearchBar value="query" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /clear search/i })).toBeInTheDocument();
  });

  it("does not show clear button when empty", () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /clear search/i })).not.toBeInTheDocument();
  });

  it("clears input on clear button click", () => {
    const onChange = vi.fn();
    render(<SearchBar value="query" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /clear search/i }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("has search role", () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.getByRole("search")).toBeInTheDocument();
  });
});
