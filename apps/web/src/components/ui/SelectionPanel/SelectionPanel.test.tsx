import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SelectionPanel } from "./SelectionPanel";

const items = [
  { id: "a", label: "Apple" },
  { id: "b", label: "Banana" },
  { id: "c", label: "Cherry" },
];

describe("SelectionPanel", () => {
  it("renders nothing when items is empty", () => {
    const { container } = render(
      <SelectionPanel
        title="Fruit"
        items={[]}
        selected={[]}
        onToggle={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders title and item labels", () => {
    render(
      <SelectionPanel
        title="Fruit"
        items={items}
        selected={[]}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("Fruit")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(screen.getByText("Cherry")).toBeInTheDocument();
  });

  it("displays selection count", () => {
    render(
      <SelectionPanel
        title="Fruit"
        items={items}
        selected={["a", "c"]}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("2/3 selected")).toBeInTheDocument();
  });

  it("calls onToggle with item id when clicked", () => {
    const onToggle = vi.fn();
    render(
      <SelectionPanel
        title="Fruit"
        items={items}
        selected={[]}
        onToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getByText("Banana"));
    expect(onToggle).toHaveBeenCalledWith("b");
  });

  it("shows check icon for selected items", () => {
    render(
      <SelectionPanel
        title="Fruit"
        items={items}
        selected={["a"]}
        onToggle={vi.fn()}
      />,
    );
    const buttons = screen.getAllByRole("button");
    // first button (Apple) should contain the Check icon mock
    expect(
      buttons[0].querySelector('[data-testid="lucide-check"]'),
    ).toBeInTheDocument();
  });

  it("shows empty checkbox for unselected items", () => {
    render(
      <SelectionPanel
        title="Fruit"
        items={items}
        selected={[]}
        onToggle={vi.fn()}
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(
      buttons[0].querySelector('[data-testid="lucide-check"]'),
    ).not.toBeInTheDocument();
  });
});
