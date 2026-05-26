import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { EmployeesPage } from "./EmployeesPage";
import { renderWithProviders } from "@/test/page-test-utils";
import { addMockDocs, clearMockDocs } from "../../../__mocks__/firebase";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("EmployeesPage", () => {
  it("renders without crashing", () => {
    addMockDocs("employees", []);
    addMockDocs("groups", []);
    renderWithProviders(<EmployeesPage />);
    expect(
      screen.getByRole("heading", { name: /employees/i }),
    ).toBeInTheDocument();
    // The SearchBar is rendered
    expect(screen.getByRole("search")).toBeInTheDocument();
  });
});
