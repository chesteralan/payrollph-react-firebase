import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "./useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return initial value when nothing stored", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("should persist value to localStorage", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));
    act(() => {
      result.current[1]("stored");
    });
    expect(result.current[0]).toBe("stored");
    expect(JSON.parse(localStorage.getItem("test-key")!)).toBe("stored");
  });

  it("should read existing value from localStorage", () => {
    localStorage.setItem("existing-key", JSON.stringify("existing-value"));
    const { result } = renderHook(() =>
      useLocalStorage("existing-key", "default"),
    );
    expect(result.current[0]).toBe("existing-value");
  });

  it("should remove value on remove", () => {
    localStorage.setItem("remove-key", JSON.stringify("value"));
    const { result } = renderHook(() =>
      useLocalStorage("remove-key", "default"),
    );
    act(() => {
      result.current[2]();
    });
    expect(result.current[0]).toBe("default");
    expect(localStorage.getItem("remove-key")).toBeNull();
  });
});
