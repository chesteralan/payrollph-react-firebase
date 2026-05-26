import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { PositionsPage } from "./PositionsPage";
import { renderWithProviders } from "@/test/page-test-utils";
import { addMockDocs, clearMockDocs } from "../../../__mocks__/firebase";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("PositionsPage", () => {
  it("renders without crashing", () => {
    addMockDocs("employee_positions", []);
    renderWithProviders(<PositionsPage />);
    expect(
      screen.getByRole("heading", { name: /positions/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search positions..."),
    ).toBeInTheDocument();
  });
});
