import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

function fireKeyDown(
  key: string,
  opts: Partial<KeyboardEventInit> = {},
  target: EventTarget = document.body,
) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...opts,
  });
  target.dispatchEvent(event);
}

describe("useKeyboardShortcuts", () => {
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addSpy = vi.spyOn(window, "addEventListener");
    removeSpy = vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("calls action when matching key is pressed", () => {
    const action = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: "k", action }]));

    act(() => fireKeyDown("k"));

    expect(action).toHaveBeenCalledTimes(1);
  });

  it("prevents default when preventDefault is not false", () => {
    const action = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: "s", action }]));

    act(() => {
      const event = new KeyboardEvent("keydown", {
        key: "s",
        bubbles: true,
        cancelable: true,
      });
      const preventSpy = vi.spyOn(event, "preventDefault");
      document.body.dispatchEvent(event);
      expect(preventSpy).toHaveBeenCalled();
    });
  });

  it("does not call action for non-matching key", () => {
    const action = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: "a", action }]));

    act(() => fireKeyDown("b"));

    expect(action).not.toHaveBeenCalled();
  });

  it("requires ctrlKey modifier when specified", () => {
    const action = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: "s", ctrlKey: true, action }]),
    );

    act(() => fireKeyDown("s"));
    expect(action).not.toHaveBeenCalled();

    act(() => fireKeyDown("s", { ctrlKey: true }));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("requires shiftKey modifier when specified", () => {
    const action = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: "a", shiftKey: true, action }]),
    );

    act(() => fireKeyDown("a"));
    expect(action).not.toHaveBeenCalled();

    act(() => fireKeyDown("a", { shiftKey: true }));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("requires altKey modifier when specified", () => {
    const action = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: "a", altKey: true, action }]),
    );

    act(() => fireKeyDown("a"));
    expect(action).not.toHaveBeenCalled();

    act(() => fireKeyDown("a", { altKey: true }));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("ignores keydown inside input elements", () => {
    const action = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: "a", action }]));

    const input = document.createElement("input");
    document.body.appendChild(input);

    act(() => fireKeyDown("a", {}, input));

    expect(action).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("registers and cleans up event listener on unmount", () => {
    const { unmount } = renderHook(() =>
      useKeyboardShortcuts([{ key: "a", action: vi.fn() }]),
    );

    expect(addSpy).toHaveBeenCalledWith("keydown", expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  });
});
