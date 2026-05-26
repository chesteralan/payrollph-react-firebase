import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./Card";

describe("Card", () => {
  it("should render children", () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText("Card Content")).toBeInTheDocument();
  });

  it("should render with default styling", () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("bg-white", "rounded-lg", "border", "shadow-sm");
  });

  it("should apply custom className", () => {
    const { container } = render(
      <Card className="custom-card">Content</Card>,
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("custom-card");
  });

  it("should render as non-clickable by default", () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).not.toHaveAttribute("role", "button");
    expect(card).not.toHaveAttribute("tabindex");
  });

  it("should render as clickable when onClick is provided", () => {
    const onClick = vi.fn();
    const { container } = render(<Card onClick={onClick}>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveAttribute("role", "button");
    expect(card).toHaveAttribute("tabindex", "0");
    expect(card).toHaveClass("cursor-pointer", "hover:shadow-md");
  });

  it("should call onClick when clickable card is clicked", () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Clickable</Card>);
    fireEvent.click(screen.getByText("Clickable"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should call onClick when Enter key is pressed", () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Clickable Card</Card>);
    const card = screen.getByText("Clickable Card");
    fireEvent.keyDown(card, { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should call onClick when Space key is pressed", () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Clickable Card</Card>);
    const card = screen.getByText("Clickable Card");
    fireEvent.keyDown(card, { key: " " });
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("CardHeader", () => {
  it("should render children", () => {
    render(<CardHeader>Header Content</CardHeader>);
    expect(screen.getByText("Header Content")).toBeInTheDocument();
  });

  it("should render with header styling", () => {
    const { container } = render(<CardHeader>Header</CardHeader>);
    const header = container.firstChild as HTMLElement;
    expect(header).toHaveClass("px-6", "py-4", "border-b");
  });

  it("should apply custom className", () => {
    const { container } = render(
      <CardHeader className="custom-header">Header</CardHeader>,
    );
    const header = container.firstChild as HTMLElement;
    expect(header).toHaveClass("custom-header");
  });
});

describe("CardTitle", () => {
  it("should render children", () => {
    render(<CardTitle>Title Content</CardTitle>);
    expect(screen.getByText("Title Content")).toBeInTheDocument();
  });

  it("should render as h3 element", () => {
    render(<CardTitle>Title</CardTitle>);
    const title = screen.getByText("Title");
    expect(title.tagName).toBe("H3");
  });

  it("should render with title styling", () => {
    const { container } = render(<CardTitle>Title</CardTitle>);
    const title = container.firstChild as HTMLElement;
    expect(title).toHaveClass("text-lg", "font-semibold", "text-gray-900");
  });

  it("should apply custom className", () => {
    const { container } = render(
      <CardTitle className="custom-title">Title</CardTitle>,
    );
    const title = container.firstChild as HTMLElement;
    expect(title).toHaveClass("custom-title");
  });
});

describe("CardContent", () => {
  it("should render children", () => {
    render(<CardContent>Content Body</CardContent>);
    expect(screen.getByText("Content Body")).toBeInTheDocument();
  });

  it("should render with content styling", () => {
    const { container } = render(<CardContent>Content</CardContent>);
    const content = container.firstChild as HTMLElement;
    expect(content).toHaveClass("px-6", "py-4");
  });

  it("should apply custom className", () => {
    const { container } = render(
      <CardContent className="custom-content">Content</CardContent>,
    );
    const content = container.firstChild as HTMLElement;
    expect(content).toHaveClass("custom-content");
  });
});

describe("CardFooter", () => {
  it("should render children", () => {
    render(<CardFooter>Footer Content</CardFooter>);
    expect(screen.getByText("Footer Content")).toBeInTheDocument();
  });

  it("should render with footer styling", () => {
    const { container } = render(<CardFooter>Footer</CardFooter>);
    const footer = container.firstChild as HTMLElement;
    expect(footer).toHaveClass(
      "px-6",
      "py-4",
      "border-t",
      "bg-gray-50",
    );
  });

  it("should apply custom className", () => {
    const { container } = render(
      <CardFooter className="custom-footer">Footer</CardFooter>,
    );
    const footer = container.firstChild as HTMLElement;
    expect(footer).toHaveClass("custom-footer");
  });
});

describe("Card composition", () => {
  it("should render a full card with all sub-components", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
        </CardHeader>
        <CardContent>Main content here</CardContent>
        <CardFooter>Footer actions</CardFooter>
      </Card>,
    );

    expect(screen.getByText("Card Title")).toBeInTheDocument();
    expect(screen.getByText("Main content here")).toBeInTheDocument();
    expect(screen.getByText("Footer actions")).toBeInTheDocument();
  });
});
