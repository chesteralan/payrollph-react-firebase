import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider } from "./Toast";
import { useToast } from "@/hooks/useToast";

// Helper component to test toast interactions
function ToastTester({
  addConfig,
}: {
  addConfig?: { type: "success" | "error" | "info" | "warning"; title: string; message?: string; duration?: number };
}) {
  const { toasts, addToast } = useToast();
  return (
    <div>
      <button
        onClick={() =>
          addToast(
            addConfig || { type: "info", title: "Test Toast", message: "Test message" },
          )
        }
      >
        Add Toast
      </button>
      <div>Toast count: {toasts.length}</div>
      {toasts.map((t) => (
        <div key={t.id} data-testid={`tester-${t.id}`}>
          Tester shows: {t.title}
        </div>
      ))}
    </div>
  );
}

describe("ToastProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render children", () => {
    render(
      <ToastProvider>
        <div>Child Content</div>
      </ToastProvider>,
    );
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("should add a toast and display it as a status element", () => {
    render(
      <ToastProvider>
        <ToastTester />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Add Toast"));
    // The toast should appear as a role="status" element
    const statusElements = screen.getAllByRole("status");
    expect(statusElements).toHaveLength(1);
    expect(statusElements[0]).toHaveTextContent("Test Toast");
  });

  it("should remove a toast when dismiss button is clicked", () => {
    render(
      <ToastProvider>
        <ToastTester />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Add Toast"));
    expect(screen.getAllByRole("status")).toHaveLength(1);

    const dismissButtons = screen.getAllByLabelText("Dismiss notification");
    expect(dismissButtons).toHaveLength(1);
    fireEvent.click(dismissButtons[0]);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("should auto-dismiss toast after duration", () => {
    render(
      <ToastProvider>
        <ToastTester
          addConfig={{
            type: "success",
            title: "Auto Dismiss",
            duration: 1000,
          }}
        />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Add Toast"));
    expect(screen.getByText("Auto Dismiss")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByText("Auto Dismiss")).not.toBeInTheDocument();
  });

  it("should display multiple toasts", () => {
    render(
      <ToastProvider>
        <ToastTester />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Add Toast"));
    fireEvent.click(screen.getByText("Add Toast"));
    fireEvent.click(screen.getByText("Add Toast"));

    // Each toast renders a role="status" element
    const statusElements = screen.getAllByRole("status");
    expect(statusElements).toHaveLength(3);
  });

  it("should remove individual toast without affecting others", () => {
    render(
      <ToastProvider>
        <ToastTester />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Add Toast"));
    fireEvent.click(screen.getByText("Add Toast"));

    const dismissButtons = screen.getAllByLabelText("Dismiss notification");
    expect(dismissButtons).toHaveLength(2);

    fireEvent.click(dismissButtons[0]);

    const remainingToasts = screen.getAllByRole("status");
    expect(remainingToasts).toHaveLength(1);
  });

  it("should support different toast types", () => {
    render(
      <ToastProvider>
        <ToastTester
          addConfig={{ type: "error", title: "Error Toast", message: "Error occurred" }}
        />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Add Toast"));
    // Check within the status element for the title
    const statusEl = screen.getByRole("status");
    expect(statusEl).toHaveTextContent("Error Toast");
  });

  it("should render toast with message visible in status element", () => {
    render(
      <ToastProvider>
        <ToastTester
          addConfig={{
            type: "warning",
            title: "Warning",
            message: "This is a warning message",
          }}
        />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Add Toast"));
    const statusEl = screen.getByRole("status");
    expect(statusEl).toHaveTextContent("Warning");
    expect(statusEl).toHaveTextContent("This is a warning message");
  });

  it("should render toast without message", () => {
    render(
      <ToastProvider>
        <ToastTester
          addConfig={{ type: "info", title: "No Message Toast" }}
        />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Add Toast"));
    const statusEl = screen.getByRole("status");
    expect(statusEl).toHaveTextContent("No Message Toast");
  });

  it("should handle toast with zero duration (persistent)", () => {
    render(
      <ToastProvider>
        <ToastTester
          addConfig={{
            type: "info",
            title: "PersistentToast",
            duration: 0,
          }}
        />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Add Toast"));
    const statusEl = screen.getByRole("status");
    expect(statusEl).toHaveTextContent("PersistentToast");

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Should still be visible after time passes
    expect(screen.getByRole("status")).toHaveTextContent("PersistentToast");
  });
});
