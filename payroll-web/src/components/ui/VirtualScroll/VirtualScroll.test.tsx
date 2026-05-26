import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VirtualScroll } from "./VirtualScroll";

interface TestItem {
  id: number;
  text: string;
}

const generateItems = (count: number): TestItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    text: `Item ${i}`,
  }));

describe("VirtualScroll", () => {
  const defaultProps = {
    items: generateItems(100),
    rowHeight: 50,
    containerHeight: 200,
    getKey: (item: TestItem) => String(item.id),
    renderRow: (item: TestItem) => <div>{item.text}</div>,
  };

  it("should render visible items within viewport", () => {
    render(<VirtualScroll {...defaultProps} />);
    // With containerHeight=200 and rowHeight=50, we expect ~4 visible rows + overscan
    expect(screen.getByText("Item 0")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
  });

  it("should not render items far outside the viewport", () => {
    render(<VirtualScroll {...defaultProps} />);
    // Item 50 should not be in the DOM
    expect(screen.queryByText("Item 50")).not.toBeInTheDocument();
    expect(screen.queryByText("Item 99")).not.toBeInTheDocument();
  });

  it("should render with list role", () => {
    render(<VirtualScroll {...defaultProps} />);
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <VirtualScroll {...defaultProps} className="custom-scroll" />,
    );
    const scrollContainer = container.firstChild as HTMLElement;
    expect(scrollContainer.classList.contains("custom-scroll")).toBe(true);
  });

  it("should render empty when items array is empty", () => {
    const { container } = render(
      <VirtualScroll {...defaultProps} items={[]} />,
    );
    const innerContainer = container.firstChild?.firstChild as HTMLElement;
    expect(innerContainer.children.length).toBe(0);
  });

  it("should use custom renderRow function", () => {
    const renderRow = (item: TestItem) => (
      <div data-testid={`custom-row-${item.id}`}>{item.text.toUpperCase()}</div>
    );
    render(<VirtualScroll {...defaultProps} renderRow={renderRow} />);
    expect(screen.getByTestId("custom-row-0")).toBeInTheDocument();
    expect(screen.getByText("ITEM 0")).toBeInTheDocument();
  });

  it("should render with custom overscan value", () => {
    render(
      <VirtualScroll
        {...defaultProps}
        overscan={10}
        items={generateItems(200)}
      />,
    );
    // More rows should be rendered with higher overscan
    expect(screen.getByText("Item 0")).toBeInTheDocument();
  });

  it("should handle single item", () => {
    render(<VirtualScroll {...defaultProps} items={generateItems(1)} />);
    expect(screen.getByText("Item 0")).toBeInTheDocument();
  });

  it("should set container height correctly", () => {
    const { container } = render(<VirtualScroll {...defaultProps} />);
    const scrollContainer = container.firstChild as HTMLElement;
    expect(scrollContainer.style.height).toBe("200px");
  });

  it("should position items absolutely with correct top offset", () => {
    render(<VirtualScroll {...defaultProps} />);
    // The items should be inside a relatively positioned inner div
    const innerDiv = document.querySelector('[style*="position: relative"]');
    expect(innerDiv).toBeInTheDocument();
    // Total height should be items * rowHeight = 100 * 50 = 5000
    expect((innerDiv as HTMLElement).style.height).toBe("5000px");
  });
});
