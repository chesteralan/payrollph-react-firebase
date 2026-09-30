import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { AuditPage } from "./AuditPage";
import { renderWithProviders } from "@/test/page-test-utils";
import { addMockDocs, clearMockDocs } from "../../../__mocks__/firebase";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("AuditPage", () => {
  it("renders without crashing", async () => {
    addMockDocs("system_audit", []);
    renderWithProviders(<AuditPage />);
    expect(
      screen.getByRole("heading", { name: /audit log/i }),
    ).toBeInTheDocument();
  });

  it("shows access denied when user lacks permission", () => {
    addMockDocs("system_audit", []);
    renderWithProviders(<AuditPage />, {
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
