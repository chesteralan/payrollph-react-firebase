import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { DatabasePage } from "./DatabasePage";
import { renderWithProviders } from "@/test/page-test-utils";
import { addMockDocs, clearMockDocs } from "../../../__mocks__/firebase";
import { COLLECTIONS } from "./SystemPages.constants";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("DatabasePage", () => {
  it("renders without crashing", async () => {
    COLLECTIONS.forEach((col) => addMockDocs(col, []));
    addMockDocs("backups", []);
    addMockDocs("employee_groups", []);

    renderWithProviders(<DatabasePage />);
    expect(
      screen.getByRole("heading", { name: /database management/i }),
    ).toBeInTheDocument();
  });

  it("shows access denied when user lacks permission", () => {
    renderWithProviders(<DatabasePage />, {
      authValue: {
        hasPermission: vi.fn(() => false),
        user: {
          id: "test-user",
          email: "test@test.com",
          displayName: "Test User",
        },
      } as never,
    });
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
  });
});
