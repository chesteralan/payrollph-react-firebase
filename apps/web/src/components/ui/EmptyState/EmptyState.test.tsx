import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No data found" />);
    expect(screen.getByText("No data found")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="Empty" description="Nothing here yet" />);
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });

  it("does not render description when omitted", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByRole("status")).toHaveTextContent("Empty");
  });

  it("renders action when provided", () => {
    render(<EmptyState title="Empty" action={<button>Add item</button>} />);
    expect(
      screen.getByRole("button", { name: /add item/i }),
    ).toBeInTheDocument();
  });

  it("has status role", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<EmptyState title="Empty" className="custom-class" />);
    expect(screen.getByRole("status").className).toContain("custom-class");
  });

  it("renders with a type", () => {
    render(<EmptyState type="employees" title="No employees" />);
    expect(screen.getByText("No employees")).toBeInTheDocument();
  });

  it("renders custom icon when provided", () => {
    render(
      <EmptyState title="Custom" icon={<span data-testid="custom-icon" />} />,
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });
});
