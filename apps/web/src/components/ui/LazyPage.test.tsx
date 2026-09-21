import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { LazyPage } from "./LazyPage";

describe("LazyPage", () => {
  it("should render children", () => {
    render(
      <LazyPage>
        <div>Page content</div>
      </LazyPage>,
    );
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("should wrap children in Suspense", () => {
    const { container } = render(
      <LazyPage>
        <div>Lazy content</div>
      </LazyPage>,
    );
    expect(container.querySelector("div")).toHaveTextContent("Lazy content");
  });

  it("should show loading fallback when child suspends", async () => {
    const LazyChild = () => {
      throw new Promise(() => {});
    };

    render(
      <LazyPage>
        <LazyChild />
      </LazyPage>,
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should render multiple children", () => {
    render(
      <LazyPage>
        <div>First</div>
        <div>Second</div>
      </LazyPage>,
    );
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });
});
