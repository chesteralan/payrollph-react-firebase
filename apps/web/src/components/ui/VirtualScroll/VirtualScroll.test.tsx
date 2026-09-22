import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VirtualScroll } from "./VirtualScroll";

const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);

function renderRow(item: string, index: number) {
  return <div data-testid={`row-${index}`}>{item}</div>;
}

describe("VirtualScroll", () => {
  it("renders the container with correct role", () => {
    render(
      <VirtualScroll
        items={items}
        rowHeight={30}
        containerHeight={150}
        renderRow={renderRow}
        getKey={(_, i) => String(i)}
      />,
    );
    expect(screen.getByRole("list")).toBeDefined();
  });

  it("renders only visible items (overscan included)", () => {
    render(
      <VirtualScroll
        items={items}
        rowHeight={30}
        containerHeight={150}
        overscan={0}
        renderRow={renderRow}
        getKey={(_, i) => String(i)}
      />,
    );
    const rows = screen.getAllByText(/Item \d+/);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(100);
  });

  it("updates visible items on scroll", () => {
    const { container } = render(
      <VirtualScroll
        items={items}
        rowHeight={30}
        containerHeight={150}
        overscan={0}
        renderRow={renderRow}
        getKey={(_, i) => String(i)}
      />,
    );

    const scrollContainer = container.querySelector('[role="list"]')!;
    fireEvent.scroll(scrollContainer, { target: { scrollTop: 900 } });

    expect(screen.getByText("Item 30")).toBeDefined();
  });
});
