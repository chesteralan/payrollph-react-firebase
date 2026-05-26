import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { AreasPage } from "./AreasPage";
import { renderWithProviders } from "@/test/page-test-utils";
import { addMockDocs, clearMockDocs } from "../../../__mocks__/firebase";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("AreasPage", () => {
  it("renders without crashing", () => {
    addMockDocs("employee_areas", []);
    renderWithProviders(<AreasPage />);
    expect(screen.getByRole("heading", { name: /areas/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search areas...")).toBeInTheDocument();
  });
});
