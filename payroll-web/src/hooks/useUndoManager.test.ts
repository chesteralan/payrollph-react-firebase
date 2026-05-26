import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUndoManager } from "./useUndoManager";

describe("useUndoManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with empty history", () => {
    const { result } = renderHook(() => useUndoManager());

    expect(result.current.history).toEqual([]);
    expect(result.current.currentIndex).toBe(-1);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("should push an action to history", () => {
    const undo = vi.fn();
    const redo = vi.fn();
    const { result } = renderHook(() => useUndoManager());

    act(() => {
      result.current.push({
        type: "edit",
        description: "Edit employee name",
        undo,
        redo,
      });
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.history[0].type).toBe("edit");
    expect(result.current.history[0].description).toBe("Edit employee name");
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it("should assign a unique id and timestamp to each action", () => {
    const { result } = renderHook(() => useUndoManager());

    act(() => {
      result.current.push({
        type: "create",
        description: "Create employee",
        undo: vi.fn(),
        redo: vi.fn(),
      });
    });

    const action = result.current.history[0];
    expect(action.id).toMatch(/^undo-/);
    expect(action.timestamp).toBeInstanceOf(Date);
  });

  it("should undo an action and decrement currentIndex", () => {
    const undo = vi.fn();
    const redo = vi.fn();
    const { result } = renderHook(() => useUndoManager());

    act(() => {
      result.current.push({
        type: "edit",
        description: "Edit employee",
        undo,
        redo,
      });
    });

    act(() => {
      result.current.undo();
    });

    expect(undo).toHaveBeenCalledTimes(1);
    expect(result.current.currentIndex).toBe(-1);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it("should redo an action and increment currentIndex", () => {
    const undo = vi.fn();
    const redo = vi.fn();
    const { result } = renderHook(() => useUndoManager());

    act(() => {
      result.current.push({
        type: "edit",
        description: "Edit employee",
        undo,
        redo,
      });
    });

    act(() => {
      result.current.undo();
    });
    expect(result.current.currentIndex).toBe(-1);

    act(() => {
      result.current.redo();
    });

    expect(redo).toHaveBeenCalledTimes(1);
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it("should handle multiple undo/redo cycles", () => {
    const undo1 = vi.fn();
    const redo1 = vi.fn();
    const undo2 = vi.fn();
    const redo2 = vi.fn();
    const { result } = renderHook(() => useUndoManager());

    act(() => {
      result.current.push({
        type: "action1",
        description: "First action",
        undo: undo1,
        redo: redo1,
      });
    });
    act(() => {
      result.current.push({
        type: "action2",
        description: "Second action",
        undo: undo2,
        redo: redo2,
      });
    });

    expect(result.current.currentIndex).toBe(1);

    act(() => {
      result.current.undo();
    });
    expect(undo2).toHaveBeenCalledTimes(1);
    expect(result.current.currentIndex).toBe(0);

    act(() => {
      result.current.undo();
    });
    expect(undo1).toHaveBeenCalledTimes(1);
    expect(result.current.currentIndex).toBe(-1);

    act(() => {
      result.current.redo();
    });
    expect(redo1).toHaveBeenCalledTimes(1);
    expect(result.current.currentIndex).toBe(0);

    act(() => {
      result.current.redo();
    });
    expect(redo2).toHaveBeenCalledTimes(1);
    expect(result.current.currentIndex).toBe(1);
  });

  it("should not undo when at the beginning of history", () => {
    const undo = vi.fn();
    const { result } = renderHook(() => useUndoManager());

    act(() => {
      result.current.undo();
    });

    expect(undo).not.toHaveBeenCalled();
    expect(result.current.canUndo).toBe(false);
  });

  it("should not redo when at the end of history", () => {
    const redo = vi.fn();
    const { result } = renderHook(() => useUndoManager());

    act(() => {
      result.current.redo();
    });

    expect(redo).not.toHaveBeenCalled();
    expect(result.current.canRedo).toBe(false);
  });

  it("should clear history and reset index", () => {
    const { result } = renderHook(() => useUndoManager());

    act(() => {
      result.current.push({
        type: "edit",
        description: "Edit employee",
        undo: vi.fn(),
        redo: vi.fn(),
      });
    });

    expect(result.current.history).toHaveLength(1);

    act(() => {
      result.current.clear();
    });

    expect(result.current.history).toEqual([]);
    expect(result.current.currentIndex).toBe(-1);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("should respect maxHistory limit", () => {
    const maxHistory = 3;
    const { result } = renderHook(() => useUndoManager(maxHistory));

    // Push 5 items with individual act() calls so state updates flush between each
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.push({
          type: `action-${i}`,
          description: `Action ${i}`,
          undo: vi.fn(),
          redo: vi.fn(),
        });
      });
    }

    expect(result.current.history).toHaveLength(maxHistory);
    expect(result.current.history[0].type).toBe("action-2");
    expect(result.current.history[1].type).toBe("action-3");
    expect(result.current.history[2].type).toBe("action-4");
    expect(result.current.currentIndex).toBe(2);
  });

  it("should truncate future history on new push after undo", () => {
    const undo1 = vi.fn();
    const redo1 = vi.fn();
    const undo2 = vi.fn();
    const redo2 = vi.fn();
    const undo3 = vi.fn();
    const redo3 = vi.fn();
    const { result } = renderHook(() => useUndoManager());

    // Push three actions
    act(() => {
      result.current.push({
        type: "a1",
        description: "A1",
        undo: undo1,
        redo: redo1,
      });
    });
    act(() => {
      result.current.push({
        type: "a2",
        description: "A2",
        undo: undo2,
        redo: redo2,
      });
    });
    act(() => {
      result.current.push({
        type: "a3",
        description: "A3",
        undo: undo3,
        redo: redo3,
      });
    });
    expect(result.current.currentIndex).toBe(2);

    // Undo once (back to a2)
    act(() => {
      result.current.undo();
    });
    expect(result.current.currentIndex).toBe(1);

    // Push new action — future (a3) should be truncated
    const undo4 = vi.fn();
    const redo4 = vi.fn();
    act(() => {
      result.current.push({
        type: "a4",
        description: "A4",
        undo: undo4,
        redo: redo4,
      });
    });

    expect(result.current.history).toHaveLength(3);
    expect(result.current.history[0].type).toBe("a1");
    expect(result.current.history[1].type).toBe("a2");
    expect(result.current.history[2].type).toBe("a4");
    expect(result.current.currentIndex).toBe(2);
  });

  it("should handle empty history gracefully on undo/redo", () => {
    const { result } = renderHook(() => useUndoManager());

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);

    act(() => {
      result.current.undo();
    });
    act(() => {
      result.current.redo();
    });

    expect(result.current.currentIndex).toBe(-1);
  });

  it("should use default maxHistory of 20", () => {
    const { result } = renderHook(() => useUndoManager());

    // Push 25 items with individual act() calls
    for (let i = 0; i < 25; i++) {
      act(() => {
        result.current.push({
          type: `action-${i}`,
          description: `Action ${i}`,
          undo: vi.fn(),
          redo: vi.fn(),
        });
      });
    }

    expect(result.current.history).toHaveLength(20);
    expect(result.current.currentIndex).toBe(19);
  });

  it("should call undo with correct arguments", () => {
    const undo = vi.fn();
    const redo = vi.fn();
    const { result } = renderHook(() => useUndoManager());

    act(() => {
      result.current.push({
        type: "move",
        description: "Move employee",
        undo,
        redo,
      });
    });

    act(() => {
      result.current.undo();
    });

    expect(undo).toHaveBeenCalledWith();
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it("should call redo with correct arguments", () => {
    const undo = vi.fn();
    const redo = vi.fn();
    const { result } = renderHook(() => useUndoManager());

    act(() => {
      result.current.push({
        type: "move",
        description: "Move employee",
        undo,
        redo,
      });
    });

    act(() => {
      result.current.undo();
    });

    act(() => {
      result.current.redo();
    });

    expect(redo).toHaveBeenCalledWith();
    expect(redo).toHaveBeenCalledTimes(1);
  });
});
