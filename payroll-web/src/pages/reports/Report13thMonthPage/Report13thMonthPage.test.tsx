import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { Report13thMonthPage } from "./Report13thMonthPage";
import { renderWithProviders } from "@/test/page-test-utils";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Report13thMonthPage", () => {
  it("renders without crashing", () => {
    renderWithProviders(<Report13thMonthPage />);
    expect(screen.getByText("13th Month Report")).toBeInTheDocument();
  });
});
