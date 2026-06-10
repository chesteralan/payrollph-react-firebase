import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce, useThrottle } from "./useDebounce";

describe("useDebounce", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should debounce calls", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const { result } = renderHook(() => useDebounce(fn, 100));

    act(() => {
      result.current("a");
      result.current("b");
      result.current("c");
    });

    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("c");
  });
});

describe("useThrottle", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should throttle calls", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 200));

    act(() => {
      result.current("a");
      result.current("b");
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a");
  });
});
