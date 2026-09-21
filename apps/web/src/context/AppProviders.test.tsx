import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { AppProviders } from "./AppProviders";
import { renderWithProviders } from "@/test/page-test-utils";

describe("AppProviders", () => {
  it("renders children without crashing", () => {
    renderWithProviders(
      <AppProviders>
        <div data-testid="child">Hello</div>
      </AppProviders>,
    );
    expect(screen.getByTestId("child")).toHaveTextContent("Hello");
  });

  it("renders multiple children", () => {
    renderWithProviders(
      <AppProviders>
        <div data-testid="a">A</div>
        <div data-testid="b">B</div>
      </AppProviders>,
    );
    expect(screen.getByTestId("a")).toBeInTheDocument();
    expect(screen.getByTestId("b")).toBeInTheDocument();
  });
});
