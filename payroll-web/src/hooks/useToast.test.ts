import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { useToast } from "./useToast";
import { ToastContext } from "../components/ui/Toast/toast-context";
import type { ToastContextType, Toast } from "../components/ui/Toast/toast-context";

function createWrapper(contextValue: ToastContextType) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      ToastContext.Provider,
      { value: contextValue },
      children,
    );
  };
}

const mockToastValue: ToastContextType = {
  toasts: [],
  addToast: vi.fn(),
  removeToast: vi.fn(),
};

describe("useToast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should provide toast context with empty toasts", () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper(mockToastValue),
    });

    expect(result.current).toBeDefined();
    expect(result.current.toasts).toEqual([]);
    expect(typeof result.current.addToast).toBe("function");
    expect(typeof result.current.removeToast).toBe("function");
  });

  it("should throw error when used outside ToastProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useToast());
    }).toThrow("useToast must be used within ToastProvider");

    consoleSpy.mockRestore();
  });

  it("should provide current toasts from context", () => {
    const toasts: Toast[] = [
      {
        id: "1",
        type: "success",
        title: "Success",
        message: "Operation completed",
      },
      {
        id: "2",
        type: "error",
        title: "Error",
        message: "Something went wrong",
      },
    ];

    const valueWithToasts: ToastContextType = {
      ...mockToastValue,
      toasts,
    };

    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper(valueWithToasts),
    });

    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[0].type).toBe("success");
    expect(result.current.toasts[1].type).toBe("error");
  });

  it("should call addToast from the context", () => {
    const addToast = vi.fn();
    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper({ ...mockToastValue, addToast }),
    });

    result.current.addToast({
      type: "info",
      title: "Info",
      message: "This is informative",
    });

    expect(addToast).toHaveBeenCalledTimes(1);
    expect(addToast).toHaveBeenCalledWith({
      type: "info",
      title: "Info",
      message: "This is informative",
    });
  });

  it("should call removeToast from the context", () => {
    const removeToast = vi.fn();
    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper({ ...mockToastValue, removeToast }),
    });

    result.current.removeToast("toast-1");

    expect(removeToast).toHaveBeenCalledTimes(1);
    expect(removeToast).toHaveBeenCalledWith("toast-1");
  });

  it("should support all toast types", () => {
    const toasts: Toast[] = [
      { id: "1", type: "success", title: "Success" },
      { id: "2", type: "error", title: "Error" },
      { id: "3", type: "info", title: "Info" },
      { id: "4", type: "warning", title: "Warning" },
    ];

    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper({ ...mockToastValue, toasts }),
    });

    expect(result.current.toasts).toHaveLength(4);
  });

  it("should render toasts with optional duration field", () => {
    const toasts: Toast[] = [
      { id: "1", type: "success", title: "Auto-dismiss", duration: 3000 },
    ];

    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper({ ...mockToastValue, toasts }),
    });

    expect(result.current.toasts[0].duration).toBe(3000);
  });

  it("should update when context value changes", () => {
    const valueRef = {
      current: {
        toasts: [] as Toast[],
        addToast: vi.fn(),
        removeToast: vi.fn(),
      },
    };
    function UpdatableWrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(
        ToastContext.Provider,
        { value: valueRef.current },
        children,
      );
    }

    const { result, rerender } = renderHook(() => useToast(), {
      wrapper: UpdatableWrapper,
    });

    expect(result.current.toasts).toHaveLength(0);

    const newToast: Toast = {
      id: "new",
      type: "warning",
      title: "Warning",
    };
    valueRef.current = {
      ...valueRef.current,
      toasts: [newToast],
    };
    rerender();

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe("Warning");
  });
});
