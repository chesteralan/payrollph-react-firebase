import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NetworkStatusBanner } from "./NetworkStatusBanner";

vi.mock("@/hooks/useNetworkStatus", () => ({
  useNetworkStatus: vi.fn(),
}));

import { useNetworkStatus } from "@/hooks/useNetworkStatus";

const mockedUseNetworkStatus = vi.mocked(useNetworkStatus);

describe("NetworkStatusBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the offline banner when offline", () => {
    mockedUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true,
    });

    render(<NetworkStatusBanner />);
    expect(
      screen.getByText(
        "You are currently offline. Changes will be saved locally and synced when connection resumes.",
      ),
    ).toBeInTheDocument();
  });

  it("should not render anything when online", () => {
    mockedUseNetworkStatus.mockReturnValue({
      isOnline: true,
      isOffline: false,
    });

    const { container } = render(<NetworkStatusBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("should have role alert", () => {
    mockedUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true,
    });

    render(<NetworkStatusBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("should display the wifi-off icon", () => {
    mockedUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true,
    });

    render(<NetworkStatusBanner />);
    expect(screen.getByTestId("lucide-wifioff")).toBeInTheDocument();
  });

  it("should show dismiss button with correct aria-label", () => {
    mockedUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true,
    });

    render(<NetworkStatusBanner />);
    expect(screen.getByLabelText("Dismiss offline notice")).toBeInTheDocument();
  });

  it("should dismiss the banner when dismiss is clicked", () => {
    mockedUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true,
    });

    render(<NetworkStatusBanner />);
    fireEvent.click(screen.getByLabelText("Dismiss offline notice"));

    expect(
      screen.queryByText("You are currently offline."),
    ).not.toBeInTheDocument();
  });

  it("should not render anything when offline and dismissed", () => {
    mockedUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true,
    });

    const { container } = render(<NetworkStatusBanner />);
    fireEvent.click(screen.getByLabelText("Dismiss offline notice"));

    expect(container.innerHTML).toBe("");
  });

  it("should not render anything when online even without dismiss", () => {
    mockedUseNetworkStatus.mockReturnValue({
      isOnline: true,
      isOffline: false,
    });

    const { container } = render(<NetworkStatusBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("should apply correct styling to the banner", () => {
    mockedUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true,
    });

    render(<NetworkStatusBanner />);
    const alertDiv = screen.getByRole("alert");
    expect(alertDiv).toHaveClass(
      "bg-yellow-50",
      "border-b",
      "border-yellow-200",
      "text-yellow-800",
    );
  });

  it("should be dismissable and stay dismissed until unmounted", () => {
    mockedUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isOffline: true,
    });

    const { rerender } = render(<NetworkStatusBanner />);
    expect(
      screen.getByText(
        "You are currently offline. Changes will be saved locally and synced when connection resumes.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Dismiss offline notice"));

    // After dismissal, banner should be gone even when still offline
    expect(
      screen.queryByText("You are currently offline."),
    ).not.toBeInTheDocument();
  });
});
