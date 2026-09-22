import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AlertBanner } from "./AlertBanner";
import type { SystemAlert } from "./AlertBanner.types";

const mockAlert: SystemAlert = {
  id: "test-alert",
  type: "warning",
  title: "Test Alert",
  message: "This is a test message.",
  dismissed: false,
};

describe("AlertBanner", () => {
  it("renders alert title and message", () => {
    const onDismiss = vi.fn();
    render(<AlertBanner alert={mockAlert} onDismiss={onDismiss} />);
    expect(screen.getByText("Test Alert")).toBeDefined();
    expect(screen.getByText("This is a test message.")).toBeDefined();
  });

  it("calls onDismiss with alert id when dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    render(<AlertBanner alert={mockAlert} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByLabelText("Dismiss warning alert"));
    expect(onDismiss).toHaveBeenCalledWith("test-alert");
  });

  it("renders info variant", () => {
    const infoAlert: SystemAlert = { ...mockAlert, id: "info-1", type: "info" };
    render(<AlertBanner alert={infoAlert} onDismiss={vi.fn()} />);
    expect(screen.getByText("Test Alert")).toBeDefined();
  });
});
