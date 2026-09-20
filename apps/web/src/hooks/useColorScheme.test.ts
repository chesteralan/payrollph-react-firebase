import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useColorScheme } from "./useColorScheme";

describe("useColorScheme", () => {
  beforeEach(() => {
    localStorage.clear();
    // Remove dark class from document
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 'system' mode by default when no stored preference", () => {
    const { result } = renderHook(() => useColorScheme());
    expect(result.current.mode).toBe("system");
  });

  it("should read stored preference from localStorage", () => {
    localStorage.setItem("color-scheme", "dark");
    const { result } = renderHook(() => useColorScheme());
    expect(result.current.mode).toBe("dark");
  });

  it("should read stored light preference from localStorage", () => {
    localStorage.setItem("color-scheme", "light");
    const { result } = renderHook(() => useColorScheme());
    expect(result.current.mode).toBe("light");
  });

  it("should set dark mode and add dark class to document", () => {
    const { result } = renderHook(() => useColorScheme());

    act(() => {
      result.current.setColorScheme("dark");
    });

    expect(result.current.mode).toBe("dark");
    expect(localStorage.getItem("color-scheme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("should set light mode and remove dark class from document", () => {
    // Start with dark mode
    document.documentElement.classList.add("dark");
    localStorage.setItem("color-scheme", "dark");
    const { result } = renderHook(() => useColorScheme());

    act(() => {
      result.current.setColorScheme("light");
    });

    expect(result.current.mode).toBe("light");
    expect(localStorage.getItem("color-scheme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("should set system mode and respect prefers-color-scheme media query", () => {
    // Mock matchMedia to return dark preference
    const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.stubGlobal("matchMedia", matchMediaMock);

    const { result } = renderHook(() => useColorScheme());

    act(() => {
      result.current.setColorScheme("system");
    });

    expect(result.current.mode).toBe("system");
    expect(localStorage.getItem("color-scheme")).toBe("system");
    // Since we mocked matchMedia to return matches: true, dark class should be added
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("should store preference in localStorage on set", () => {
    const { result } = renderHook(() => useColorScheme());
    expect(localStorage.getItem("color-scheme")).toBeNull(); // Not stored on initial load

    act(() => {
      result.current.setColorScheme("dark");
    });

    expect(localStorage.getItem("color-scheme")).toBe("dark");

    act(() => {
      result.current.setColorScheme("light");
    });

    expect(localStorage.getItem("color-scheme")).toBe("light");
  });

  it("should handle multiple mode toggles", () => {
    const { result } = renderHook(() => useColorScheme());

    // system -> dark
    act(() => result.current.setColorScheme("dark"));
    expect(result.current.mode).toBe("dark");

    // dark -> light
    act(() => result.current.setColorScheme("light"));
    expect(result.current.mode).toBe("light");

    // light -> system
    act(() => result.current.setColorScheme("system"));
    expect(result.current.mode).toBe("system");

    // system -> dark (full cycle)
    act(() => result.current.setColorScheme("dark"));
    expect(result.current.mode).toBe("dark");
  });

  it("should clean up when unmounted (no state updates)", () => {
    const { result, unmount } = renderHook(() => useColorScheme());
    unmount();

    // After unmount, the returned refs should still hold the last value
    expect(result.current.mode).toBe("system");
  });
});
