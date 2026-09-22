import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NetworkStatusBanner } from "./NetworkStatusBanner";

vi.mock("@/hooks/useNetworkStatus", () => ({
  useNetworkStatus: vi.fn(),
}));

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
const mockUseNetworkStatus = vi.mocked(useNetworkStatus);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NetworkStatusBanner", () => {
  it("renders nothing when online", () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: true, isOffline: false });
    const { container } = render(<NetworkStatusBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("renders banner when offline", () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false, isOffline: true });
    render(<NetworkStatusBanner />);
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText(/You are currently offline/)).toBeDefined();
  });

  it("dismisses banner when dismiss button is clicked", () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false, isOffline: true });
    render(<NetworkStatusBanner />);
    expect(screen.getByRole("alert")).toBeDefined();

    fireEvent.click(screen.getByLabelText("Dismiss offline notice"));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
