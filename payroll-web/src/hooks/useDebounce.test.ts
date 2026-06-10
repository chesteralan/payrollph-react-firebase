import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useDebounce, useThrottle } from "./useDebounce";

describe("useDebounce", () => {
  beforeEach(() => vi.useFakeTimers());

  it("should delay execution", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebounce(fn, 200));
    act(() => result.current("test"));
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledWith("test");
  });

  it("should cancel previous calls", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebounce(fn, 200));
    act(() => { result.current("a"); result.current("b"); result.current("c"); });
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("c");
  });
});

describe("useThrottle", () => {
  beforeEach(() => vi.useFakeTimers());

  it("should limit calls", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 500));
    act(() => { result.current("a"); result.current("b"); result.current("c"); });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a");
  });
});
