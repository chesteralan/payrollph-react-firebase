import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { SetupPage } from "./SetupPage";
import { renderWithProviders } from "@/test/page-test-utils";

// Mock the setup service
vi.mock("@/services/setup", () => ({
  checkSetupNeeded: vi.fn().mockResolvedValue(true),
  setupAdminUser: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SetupPage", () => {
  it("renders without crashing - shows checking state initially", () => {
    renderWithProviders(<SetupPage />);
    expect(screen.getByText("Checking setup status...")).toBeInTheDocument();
  });

  it("renders form when setup is needed", async () => {
    renderWithProviders(<SetupPage />);
    expect(
      await screen.findByRole("heading", { name: /initial setup/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/create admin user/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /complete setup/i }),
    ).toBeInTheDocument();
  });
});
