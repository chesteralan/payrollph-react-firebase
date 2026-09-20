import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { LoginPage } from "./LoginPage";
import { renderWithProviders } from "@/test/page-test-utils";

// Mock the setup service so checkSetupNeeded resolves immediately
vi.mock("@/services/setup", () => ({
  checkSetupNeeded: vi.fn().mockResolvedValue(false),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LoginPage", () => {
  it("renders without crashing", async () => {
    renderWithProviders(<LoginPage />);
    expect(
      await screen.findByRole("heading", { name: /smb payroll/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });
});
