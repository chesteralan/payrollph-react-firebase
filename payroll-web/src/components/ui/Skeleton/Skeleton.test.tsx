import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  PageSkeleton,
} from "./Skeleton";

describe("Skeleton", () => {
  it("should render with default variant (text)", () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass("bg-gray-200", "rounded", "animate-pulse");
  });

  it("should render with circular variant", () => {
    const { container } = render(<Skeleton variant="circular" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass("rounded-full");
  });

  it("should render with rectangular variant", () => {
    const { container } = render(<Skeleton variant="rectangular" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass("bg-gray-200", "rounded");
  });

  it("should render multiple lines for text variant", () => {
    const { container } = render(<Skeleton variant="text" lines={3} />);
    const innerDiv = container.firstChild as HTMLElement;
    expect(innerDiv.children.length).toBe(3);
  });

  it("should render single line for text variant with lines=1", () => {
    const { container } = render(<Skeleton variant="text" lines={1} />);
    expect(container.firstChild).not.toHaveClass("space-y-2");
  });

  it("should not wrap in div when lines=1", () => {
    const { container } = render(<Skeleton variant="text" lines={1} />);
    // Should be a single div element, not a wrapper div
    expect(container.firstChild).toBeInstanceOf(HTMLElement);
    expect(container.firstChild!.childNodes.length).toBe(0);
  });

  it("should apply custom className", () => {
    const { container } = render(
      <Skeleton className="custom-class" />,
    );
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass("custom-class");
  });

  it("should have aria-hidden attribute", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild as HTMLElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("should accept custom width and height", () => {
    const { container } = render(
      <Skeleton width="200px" height="50px" />,
    );
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.style.width).toBe("200px");
    expect(skeleton.style.height).toBe("50px");
  });

  it("should set last line to 75% width for multi-line text", () => {
    const { container } = render(<Skeleton variant="text" lines={3} />);
    const lines = container.firstChild!.childNodes;
    const lastLine = lines[lines.length - 1] as HTMLElement;
    expect(lastLine.style.width).toBe("75%");
  });

  it("should render with no animation when animation is none", () => {
    const { container } = render(<Skeleton animation="none" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).not.toHaveClass("animate-pulse");
  });
});

describe("CardSkeleton", () => {
  it("should render with default props", () => {
    const { container } = render(<CardSkeleton />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("bg-white", "rounded-lg", "border");
  });

  it("should show header when showHeader is true", () => {
    const { container } = render(<CardSkeleton showHeader={true} />);
    const skeletons = container.querySelectorAll(".bg-gray-200");
    expect(skeletons.length).toBeGreaterThanOrEqual(2);
  });

  it("should hide header when showHeader is false", () => {
    const { container } = render(<CardSkeleton showHeader={false} />);
    // With no header, the container has fewer skeleton elements
    const flexContainers = container.querySelectorAll(".flex");
    expect(flexContainers.length).toBe(0);
  });

  it("should render with specified number of text lines", () => {
    render(<CardSkeleton lines={5} />);
    // CardSkeleton renders a Skeleton with lines=5 inside
    const container = document.querySelector(".space-y-4");
    expect(container).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <CardSkeleton className="custom-card" />,
    );
    expect(container.firstChild as HTMLElement).toHaveClass("custom-card");
  });
});

describe("TableSkeleton", () => {
  it("should render with default props (5 rows, 4 cols)", () => {
    const { container } = render(<TableSkeleton />);
    expect(container.firstChild).toHaveClass(
      "bg-white",
      "rounded-lg",
      "border",
    );
  });

  it("should render specified number of rows", () => {
    const { container } = render(<TableSkeleton rows={3} cols={4} />);
    const rows = container.querySelectorAll(".divide-y > div");
    // Header row + data rows
    expect(rows.length).toBe(3);
  });

  it("should render specified number of columns", () => {
    const { container } = render(<TableSkeleton rows={1} cols={6} />);
    const flexRows = container.querySelectorAll(".flex.gap-4");
    flexRows.forEach((row) => {
      expect(row.children.length).toBe(6);
    });
  });

  it("should render header row", () => {
    const { container } = render(<TableSkeleton rows={1} cols={3} />);
    const header = container.querySelector(".px-6.py-3");
    expect(header).toBeInTheDocument();
  });
});

describe("PageSkeleton", () => {
  it("should render with default props", () => {
    const { container } = render(<PageSkeleton />);
    expect(container.firstChild).toHaveClass("space-y-6");
  });

  it("should render specified number of sections", () => {
    const { container } = render(<PageSkeleton sections={2} />);
    const cards = container.querySelectorAll(".rounded-lg.border");
    // Each section contains a CardSkeleton
    expect(cards.length).toBe(2);
  });

  it("should render header area with two skeleton elements", () => {
    const { container } = render(<PageSkeleton sections={1} />);
    const headerRow = container.querySelector(".flex.items-center.justify-between");
    expect(headerRow).toBeInTheDocument();
    expect(headerRow!.children.length).toBe(2);
  });
});
