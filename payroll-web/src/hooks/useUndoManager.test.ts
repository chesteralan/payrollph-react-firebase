import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUndoManager } from "./useUndoManager";

// Helper to advance past the default debounce window (500ms)
function pastDebounce() {
  vi.advanceTimersByTime(600);
}

describe("useUndoManager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should initialize with the given state and no history", () => {
    const { result } = renderHook(() =>
      useUndoManager({ id: "1", name: "Initial" }),
    );

    expect(result.current.state).toEqual({ id: "1", name: "Initial" });
    expect(result.current.past).toEqual([]);
    expect(result.current.future).toEqual([]);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("should push a state snapshot and allow undo", () => {
    const { result } = renderHook(() =>
      useUndoManager({ id: "1", name: "Initial" }),
    );

    act(() => {
      result.current.pushState({ id: "1", name: "Updated" });
    });

    expect(result.current.state).toEqual({ id: "1", name: "Updated" });
    expect(result.current.past).toHaveLength(1);
    expect(result.current.past[0]).toEqual({ id: "1", name: "Initial" });
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);

    act(() => {
      result.current.undo();
    });

    expect(result.current.state).toEqual({ id: "1", name: "Initial" });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it("should redo after undo", () => {
    const { result } = renderHook(() =>
      useUndoManager({ id: "1", name: "Initial" }),
    );

    act(() => {
      result.current.pushState({ id: "1", name: "Updated" });
    });
    act(() => {
      result.current.undo();
    });

    expect(result.current.state).toEqual({ id: "1", name: "Initial" });

    act(() => {
      result.current.redo();
    });

    expect(result.current.state).toEqual({ id: "1", name: "Updated" });
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it("should handle multiple pushState and undo cycles", () => {
    const { result } = renderHook(() =>
      useUndoManager({ id: "1", name: "A" }),
    );

    // Push with debounce gap between each so they're separate undo steps
    act(() => {
      result.current.pushState({ id: "1", name: "B" });
    });
    act(() => pastDebounce());
    act(() => {
      result.current.pushState({ id: "1", name: "C" });
    });
    act(() => pastDebounce());
    act(() => {
      result.current.pushState({ id: "1", name: "D" });
    });

    expect(result.current.state).toEqual({ id: "1", name: "D" });
    expect(result.current.past).toHaveLength(3);

    // Undo twice
    act(() => {
      result.current.undo();
    });
    expect(result.current.state).toEqual({ id: "1", name: "C" });

    act(() => {
      result.current.undo();
    });
    expect(result.current.state).toEqual({ id: "1", name: "B" });

    // Redo once
    act(() => {
      result.current.redo();
    });
    expect(result.current.state).toEqual({ id: "1", name: "C" });

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);
  });

  it("should not undo when at the beginning of history", () => {
    const { result } = renderHook(() =>
      useUndoManager({ id: "1", name: "Start" }),
    );

    act(() => {
      result.current.undo();
    });

    expect(result.current.state).toEqual({ id: "1", name: "Start" });
    expect(result.current.canUndo).toBe(false);
  });

  it("should not redo when at the end of history", () => {
    const { result } = renderHook(() =>
      useUndoManager({ id: "1", name: "Start" }),
    );

    act(() => {
      result.current.pushState({ id: "1", name: "B" });
    });
    act(() => pastDebounce());
    act(() => {
      result.current.undo();
    });

    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.redo();
    });
    expect(result.current.canRedo).toBe(false);
  });

  it("should clear history and reset to the given initial state", () => {
    const { result } = renderHook(() =>
      useUndoManager({ id: "1", name: "Start" }),
    );

    act(() => {
      result.current.pushState({ id: "1", name: "B" });
    });
    act(() => pastDebounce());
    act(() => {
      result.current.pushState({ id: "1", name: "C" });
    });
    expect(result.current.past).toHaveLength(2);

    act(() => {
      result.current.clear({ id: "2", name: "Fresh" });
    });

    expect(result.current.state).toEqual({ id: "2", name: "Fresh" });
    expect(result.current.past).toEqual([]);
    expect(result.current.future).toEqual([]);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("should respect maxHistory limit", () => {
    const maxHistory = 3;
    const { result } = renderHook(() =>
      useUndoManager({ id: "1", name: "A" }, maxHistory, 100),
    );

    // Push 4 items with debounce gap between each
    for (const name of ["B", "C", "D", "E"]) {
      act(() => {
        result.current.pushState({ id: "1", name });
      });
      act(() => vi.advanceTimersByTime(200));
    }

    expect(result.current.past.length).toBeLessThanOrEqual(maxHistory);
    expect(result.current.state.name).toBe("E");
  });

  it("should truncate future history on new push after undo", () => {
    const { result } = renderHook(() =>
      useUndoManager({ id: "1", name: "A" }, 50, 100),
    );

    act(() => {
      result.current.pushState({ id: "1", name: "B" });
    });
    act(() => vi.advanceTimersByTime(200));
    act(() => {
      result.current.pushState({ id: "1", name: "C" });
    });
    act(() => vi.advanceTimersByTime(200));

    // Go back to B
    act(() => {
      result.current.undo();
    });
    expect(result.current.state.name).toBe("B");

    // Push new state D — future (C) should be truncated
    act(() => {
      result.current.pushState({ id: "1", name: "D" });
    });

    expect(result.current.state.name).toBe("D");
    expect(result.current.future).toEqual([]);
    expect(result.current.past.map((s: { name: string }) => s.name)).toEqual([
      "A",
      "B",
    ]);
  });

  it("should group rapid changes into a single undo step", () => {
    const { result } = renderHook(() =>
      useUndoManager({ id: "1", name: "A" }, 50, 500),
    );

    // Rapid pushes within the 500ms debounce window
    act(() => {
      result.current.pushState({ id: "1", name: "B" });
    });
    act(() => {
      result.current.pushState({ id: "1", name: "C" });
    });
    act(() => {
      result.current.pushState({ id: "1", name: "D" });
    });

    // All grouped: past should only have the initial state (A)
    expect(result.current.past).toHaveLength(1);
    expect(result.current.past[0].name).toBe("A");
    expect(result.current.state.name).toBe("D");

    // Single undo should go all the way back to A
    act(() => {
      result.current.undo();
    });
    expect(result.current.state.name).toBe("A");
    expect(result.current.canUndo).toBe(false);
  });

  it("should not group after the debounce timer expires", () => {
    const { result } = renderHook(() =>
      useUndoManager({ id: "1", name: "A" }, 50, 300),
    );

    act(() => {
      result.current.pushState({ id: "1", name: "B" });
    });

    // Wait for debounce to expire
    act(() => vi.advanceTimersByTime(400));

    act(() => {
      result.current.pushState({ id: "1", name: "C" });
    });

    // Two separate undo steps
    expect(result.current.past).toHaveLength(2);
    expect(result.current.past.map((s: { name: string }) => s.name)).toEqual([
      "A",
      "B",
    ]);
    expect(result.current.state.name).toBe("C");
  });

  it("should support generic type inference", () => {
    interface CustomState {
      value: number;
      label: string;
    }

    const { result } = renderHook(() =>
      useUndoManager<CustomState>({ value: 0, label: "zero" }),
    );

    act(() => {
      result.current.pushState({ value: 1, label: "one" });
    });

    expect(result.current.state.value).toBe(1);
    expect(result.current.state.label).toBe("one");
    expect(result.current.past[0].value).toBe(0);

    act(() => {
      result.current.undo();
    });

    expect(result.current.state.value).toBe(0);
    expect(result.current.state.label).toBe("zero");
  });

  it("should handle undo correctly after grouped pushes then a separated push", () => {
    const { result } = renderHook(() =>
      useUndoManager({ id: "1", name: "A" }, 50, 500),
    );

    // Group 1: rapid pushes B, C
    act(() => {
      result.current.pushState({ id: "1", name: "B" });
    });
    act(() => {
      result.current.pushState({ id: "1", name: "C" });
    });

    // Wait for debounce
    act(() => vi.advanceTimersByTime(600));

    // Group 2: rapid pushes D, E
    act(() => {
      result.current.pushState({ id: "1", name: "D" });
    });
    act(() => {
      result.current.pushState({ id: "1", name: "E" });
    });

    // Past should have A and C (state before each group)
    expect(result.current.past).toHaveLength(2);
    expect(result.current.past[0].name).toBe("A");
    expect(result.current.past[1].name).toBe("C");
    expect(result.current.state.name).toBe("E");

    // Undo once: should go back to C (state before group 2 started)
    act(() => {
      result.current.undo();
    });
    expect(result.current.state.name).toBe("C");

    // Undo again: should go back to A (state before group 1 started)
    act(() => {
      result.current.undo();
    });
    expect(result.current.state.name).toBe("A");
    expect(result.current.canUndo).toBe(false);
  });

  it("should cancel grouping on undo", () => {
    const { result } = renderHook(() =>
      useUndoManager({ id: "1", name: "A" }, 50, 500),
    );

    // Start a group
    act(() => {
      result.current.pushState({ id: "1", name: "B" });
    });
    act(() => {
      result.current.pushState({ id: "1", name: "C" });
    });

    // Undo — this should cancel the group
    act(() => {
      result.current.undo();
    });
    expect(result.current.state.name).toBe("A");

    // Next push should be a fresh history entry, not grouped
    act(() => {
      result.current.pushState({ id: "1", name: "D" });
    });

    expect(result.current.past).toHaveLength(1);
    expect(result.current.past[0].name).toBe("A");
    expect(result.current.state.name).toBe("D");
  });

  it("should handle empty history gracefully", () => {
    const { result } = renderHook(() =>
      useUndoManager({ id: "1", name: "Start" }),
    );

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);

    act(() => {
      result.current.undo();
    });
    act(() => {
      result.current.redo();
    });

    expect(result.current.state).toEqual({ id: "1", name: "Start" });
  });

  it("should use default maxHistory of 50", () => {
    const { result } = renderHook(() =>
      useUndoManager({ id: "1", name: "A" }),
    );

    // Push 25 items with debounce gap between each
    for (let i = 0; i < 25; i++) {
      act(() => {
        result.current.pushState({ id: "1", name: `item-${i}` });
      });
      act(() => pastDebounce());
    }

    expect(result.current.past).toHaveLength(25);
  });

  it("should preserve undo stack after undo → push → redo boundary", () => {
    const { result } = renderHook(() =>
      useUndoManager({ id: "1", name: "A" }),
    );

    act(() => {
      result.current.pushState({ id: "1", name: "B" });
    });
    act(() => pastDebounce());

    // Undo back to A, then push C — B should still be in past
    act(() => {
      result.current.undo();
    });
    expect(result.current.state.name).toBe("A");

    act(() => {
      result.current.pushState({ id: "1", name: "C" });
    });

    expect(result.current.past.map((s: { name: string }) => s.name)).toEqual([
      "A",
    ]);
    expect(result.current.state.name).toBe("C");
    expect(result.current.future).toEqual([]);
  });
});
