import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts, useGlobalShortcuts } from "./useKeyboardShortcuts";

interface Shortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  preventDefault?: boolean;
}

function createKeyboardEvent(overrides: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return new KeyboardEvent("keydown", {
    key: "a",
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    bubbles: true,
    cancelable: true,
    ...overrides,
  });
}

/**
 * Dispatch a keydown event on document.body so that it bubbles up to window
 * (where the hook's listener is attached). jsdom's window.dispatchEvent sets
 * event.target to window, which lacks a tagName property, causing the hook's
 * `(e.target as HTMLElement).tagName.toLowerCase()` to throw.
 */
function triggerKey(overrides: Partial<KeyboardEvent> = {}) {
  document.body.dispatchEvent(createKeyboardEvent(overrides));
}

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call action when matching key is pressed", () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [{ key: "a", action }];

    renderHook(() => useKeyboardShortcuts(shortcuts));
    triggerKey({ key: "a" });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it("should not call action for non-matching keys", () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [{ key: "a", action }];

    renderHook(() => useKeyboardShortcuts(shortcuts));
    triggerKey({ key: "b" });

    expect(action).not.toHaveBeenCalled();
  });

  it("should call action when ctrl+key combination matches", () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [{ key: "s", ctrlKey: true, action }];

    renderHook(() => useKeyboardShortcuts(shortcuts));
    triggerKey({ key: "s", ctrlKey: true });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it("should not call action when ctrlKey is required but not pressed", () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [{ key: "s", ctrlKey: true, action }];

    renderHook(() => useKeyboardShortcuts(shortcuts));
    triggerKey({ key: "s", ctrlKey: false });

    expect(action).not.toHaveBeenCalled();
  });

  it("should call action when shift+key combination matches", () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [{ key: "P", shiftKey: true, action }];

    renderHook(() => useKeyboardShortcuts(shortcuts));
    triggerKey({ key: "P", shiftKey: true });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it("should call action when alt+key combination matches", () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [{ key: "x", altKey: true, action }];

    renderHook(() => useKeyboardShortcuts(shortcuts));
    triggerKey({ key: "x", altKey: true });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it("should be case-insensitive for key matching", () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [{ key: "A", action }];

    renderHook(() => useKeyboardShortcuts(shortcuts));
    triggerKey({ key: "a" });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it("should call preventDefault when preventDefault is not explicitly false", () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [{ key: "a", action }];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = createKeyboardEvent({ key: "a" });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    document.body.dispatchEvent(event);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("should not call preventDefault when preventDefault is false", () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [
      { key: "a", action, preventDefault: false },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = createKeyboardEvent({ key: "a" });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    document.body.dispatchEvent(event);
    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it("should call preventDefault when preventDefault is true", () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [
      { key: "a", action, preventDefault: true },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = createKeyboardEvent({ key: "a" });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    document.body.dispatchEvent(event);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("should match ctrl or meta key for ctrlKey shortcuts", () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [{ key: "s", ctrlKey: true, action }];

    renderHook(() => useKeyboardShortcuts(shortcuts));
    triggerKey({ key: "s", ctrlKey: false, metaKey: true });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it("should not fire for input/textarea/select elements", () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [{ key: "a", action }];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Simulate keydown on an input element directly (doesn't bubble to body listener)
    const input = document.createElement("input");
    const event = createKeyboardEvent({ key: "a" });
    input.dispatchEvent(event);

    expect(action).not.toHaveBeenCalled();
  });

  it("should handle multiple shortcuts", () => {
    const actionA = vi.fn();
    const actionB = vi.fn();
    const actionC = vi.fn();
    const shortcuts: Shortcut[] = [
      { key: "a", action: actionA },
      { key: "b", action: actionB },
      { key: "c", ctrlKey: true, action: actionC },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    triggerKey({ key: "a" });
    expect(actionA).toHaveBeenCalledTimes(1);
    expect(actionB).not.toHaveBeenCalled();

    triggerKey({ key: "b" });
    expect(actionB).toHaveBeenCalledTimes(1);

    triggerKey({ key: "c", ctrlKey: true });
    expect(actionC).toHaveBeenCalledTimes(1);
  });

  it("should only trigger the first matching shortcut and break", () => {
    const action1 = vi.fn();
    const action2 = vi.fn();
    const shortcuts: Shortcut[] = [
      { key: "a", action: action1 },
      { key: "a", action: action2 },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));
    triggerKey({ key: "a" });

    expect(action1).toHaveBeenCalledTimes(1);
    expect(action2).not.toHaveBeenCalled();
  });

  it("should clean up event listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const action = vi.fn();

    const { unmount } = renderHook(() =>
      useKeyboardShortcuts([{ key: "a", action }]),
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function),
    );
  });

  it("should use updated shortcuts when they change", () => {
    const actionA = vi.fn();
    const actionB = vi.fn();

    const { rerender } = renderHook(
      ({ shortcuts }: { shortcuts: Shortcut[] }) =>
        useKeyboardShortcuts(shortcuts),
      { initialProps: { shortcuts: [{ key: "a", action: actionA }] } },
    );

    triggerKey({ key: "a" });
    expect(actionA).toHaveBeenCalledTimes(1);

    // Rerender with new shortcuts
    rerender({ shortcuts: [{ key: "b", action: actionB }] });

    triggerKey({ key: "b" });
    expect(actionB).toHaveBeenCalledTimes(1);
  });
});

describe("useGlobalShortcuts", () => {
  it("should call navigate with correct paths", () => {
    const navigate = vi.fn();

    renderHook(() => useGlobalShortcuts(navigate));

    // Ctrl+Shift+D → /dashboard
    triggerKey({ key: "d", ctrlKey: true, shiftKey: true });
    expect(navigate).toHaveBeenCalledWith("/dashboard");

    // Ctrl+Shift+E → /employees
    triggerKey({ key: "e", ctrlKey: true, shiftKey: true });
    expect(navigate).toHaveBeenCalledWith("/employees");

    // Ctrl+Shift+P → /payroll
    triggerKey({ key: "p", ctrlKey: true, shiftKey: true });
    expect(navigate).toHaveBeenCalledWith("/payroll");

    // Ctrl+N → /payroll/new
    triggerKey({ key: "n", ctrlKey: true });
    expect(navigate).toHaveBeenCalledWith("/payroll/new");
  });

  it("should handle undefined navigate gracefully", () => {
    // useGlobalShortcuts with undefined navigate should not throw
    expect(() => {
      renderHook(() => useGlobalShortcuts(undefined));
    }).not.toThrow();
  });
});
