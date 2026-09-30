import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider } from "./Toast";
import { useToast } from "@/hooks/useToast";

function TestConsumer() {
  const { addToast, removeToast, toasts } = useToast();
  return (
    <div>
      <button onClick={() => addToast({ type: "success", title: "Saved" })}>
        Add success
      </button>
      <button
        onClick={() =>
          addToast({ type: "error", title: "Oops", message: "Details here" })
        }
      >
        Add error with message
      </button>
      <button
        onClick={() =>
          addToast({ type: "info", title: "Heads up", duration: 100 })
        }
      >
        Add auto-dismiss
      </button>
      <span data-testid="count">{toasts.length}</span>
      {toasts.map((t) => (
        <div key={t.id} data-testid={`toast-${t.id}`}>
          <span>{t.title}</span>
          {t.message && <span>{t.message}</span>}
          <button onClick={() => removeToast(t.id)}>dismiss</button>
        </div>
      ))}
    </div>
  );
}

function renderWithProvider(ui?: React.ReactNode) {
  return render(<ToastProvider>{ui ?? <TestConsumer />}</ToastProvider>);
}

describe("ToastProvider & useToast", () => {
  it("starts with zero toasts", () => {
    renderWithProvider();
    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("adds a toast via addToast", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Add success"));
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getAllByText("Saved").length).toBeGreaterThanOrEqual(1);
  });

  it("renders message when provided", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Add error with message"));
    expect(screen.getAllByText("Details here").length).toBeGreaterThanOrEqual(
      1,
    );
  });

  it("removes a toast via dismiss button", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Add success"));
    expect(screen.getByTestId("count").textContent).toBe("1");
    fireEvent.click(screen.getByText("dismiss"));
    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("auto-dismisses after duration", async () => {
    vi.useFakeTimers();
    renderWithProvider();
    act(() => {
      fireEvent.click(screen.getByText("Add auto-dismiss"));
    });
    expect(screen.getByTestId("count").textContent).toBe("1");
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByTestId("count").textContent).toBe("0");
    vi.useRealTimers();
  });
});

describe("Toast component rendering", () => {
  it("renders toast items inside the provider", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Add success"));
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("dismiss button has accessible label", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Add success"));
    expect(
      screen.getByRole("button", { name: "Dismiss notification" }),
    ).toBeInTheDocument();
  });
});

describe("useToast outside provider", () => {
  it("throws when used outside ToastProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    function Bad() {
      useToast();
      return null;
    }
    expect(() => render(<Bad />)).toThrow();
    spy.mockRestore();
  });
});
