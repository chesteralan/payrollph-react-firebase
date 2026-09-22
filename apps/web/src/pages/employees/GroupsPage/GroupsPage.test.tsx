import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { EmployeeGroupsPage } from "./GroupsPage";
import { renderWithProviders } from "@/test/page-test-utils";
import { addMockDocs, clearMockDocs } from "../../../__mocks__/firebase";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("EmployeeGroupsPage", () => {
  it("renders without crashing", () => {
    addMockDocs("employee_groups", []);
    renderWithProviders(<EmployeeGroupsPage />);
    expect(
      screen.getByRole("heading", { name: /employee groups/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search groups...")).toBeInTheDocument();
  });
});
