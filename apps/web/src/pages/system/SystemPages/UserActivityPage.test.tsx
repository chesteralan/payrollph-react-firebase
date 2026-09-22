import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { UserActivityPage } from "./UserActivityPage";
import { renderWithProviders } from "@/test/page-test-utils";

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    canView: () => true,
    canAdd: () => true,
    canEdit: () => true,
    canDelete: () => true,
  }),
}));

vi.mock("@/hooks/useActivityMonitor", () => ({
  useActivityMonitor: () => ({
    activities: [],
    activityCount: 0,
    lastActivity: null,
    clearActivities: vi.fn(),
  }),
}));

describe("UserActivityPage", () => {
  it("renders the activity monitor heading", () => {
    renderWithProviders(<UserActivityPage />);
    expect(
      screen.getByRole("heading", { name: /user activity monitor/i }),
    ).toBeInTheDocument();
  });

  it("shows activity count", () => {
    renderWithProviders(<UserActivityPage />);
    expect(screen.getByText(/0 activities logged/)).toBeInTheDocument();
  });

  it("shows empty state when no activities", () => {
    renderWithProviders(<UserActivityPage />);
    expect(
      screen.getByText(/no activities recorded this session/i),
    ).toBeInTheDocument();
  });
});
