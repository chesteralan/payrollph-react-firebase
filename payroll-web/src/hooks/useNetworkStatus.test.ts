import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNetworkStatus } from "./useNetworkStatus";

describe("useNetworkStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to online before each test
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
  });

  it("should return isOnline as true when navigator.onLine is true", () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
  });

  it("should return isOnline as false when navigator.onLine is false", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });

    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
  });

  it("should update to offline when window fires 'offline' event", () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);

    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
  });

  it("should update to online when window fires 'online' event", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });

    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(false);

    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
  });

  it("should handle multiple online/offline transitions", () => {
    const { result } = renderHook(() => useNetworkStatus());

    // Online → Offline → Online → Offline
    const setOnline = (val: boolean) => {
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        value: val,
      });
    };

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.isOnline).toBe(false);

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current.isOnline).toBe(true);

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.isOnline).toBe(false);
  });

  it("should remove event listeners on unmount", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useNetworkStatus());

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "online",
      expect.any(Function),
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "offline",
      expect.any(Function),
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "online",
      expect.any(Function),
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "offline",
      expect.any(Function),
    );
  });

  it("should not update state after unmount", () => {
    const { result, unmount } = renderHook(() => useNetworkStatus());
    unmount();

    // After unmount, events should be removed so this shouldn't do anything
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    window.dispatchEvent(new Event("offline"));

    // The result snapshot is frozen after unmount, but the key
    // is that no state-update-after-unmount warning fires.
    expect(result.current.isOnline).toBe(true);
  });
});
