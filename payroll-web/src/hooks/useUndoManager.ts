import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Generic undo/redo manager that stores state snapshots.
 *
 * Features:
 * - State snapshot history with configurable max depth (default 50)
 * - Debounced grouping: rapid pushState calls within `debounceMs`
 *   are grouped into a single undo step
 * - Full TypeScript generics for type safety
 * - Truncates future history on new push (standard undo behavior)
 */
export interface UndoManager<T> {
  /** Current state (the present) */
  state: T;
  /** Past state snapshots (stack, most recent at end) */
  past: T[];
  /** Future state snapshots available for redo */
  future: T[];
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Push a new state snapshot (truncates future) */
  pushState: (snapshot: T) => void;
  /** Undo: restore the previous state snapshot */
  undo: () => void;
  /** Redo: restore the next state snapshot */
  redo: () => void;
  /** Clear history and reset to an initial state */
  clear: (initial: T) => void;
}

/**
 * Creates a generic undo/redo manager that stores state snapshots.
 *
 * @param initial - The initial state
 * @param maxHistory - Maximum number of past states to keep (default: 50)
 * @param debounceMs - Time window in ms for grouping rapid changes (default: 500).
 *   Uses wall-clock time (Date.now()) so it works correctly with fake timers in tests.
 *
 * @example
 * ```ts
 * const { state, pushState, undo, redo, canUndo, canRedo } = useUndoManager(initialFormData);
 *
 * // When form fields change:
 * pushState(newFormData);
 *
 * // Handle keyboard shortcuts:
 * <button onClick={undo} disabled={!canUndo}>Undo</button>
 * <button onClick={redo} disabled={!canRedo}>Redo</button>
 * ```
 */
export function useUndoManager<T>(
  initial: T,
  maxHistory = 50,
  debounceMs = 500,
): UndoManager<T> {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initial);
  const [future, setFuture] = useState<T[]>([]);

  // Track the last push time using Date.now() so it works correctly
  // with vitest fake timers (vi.advanceTimersByTime advances Date.now()).
  const lastPushTimeRef = useRef(0);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const pushState = useCallback(
    (newState: T) => {
      const now = Date.now();
      const isGrouped = now - lastPushTimeRef.current < debounceMs;

      setPast((prev) => {
        if (isGrouped) {
          // We're inside the debounce window — don't push a new past entry.
          // This groups all rapid changes into a single undo step that
          // restores the state *before* the group started.
          return prev;
        }
        // Normal push: save current present into past
        const updated = [...prev, present];
        return updated.length > maxHistory
          ? updated.slice(updated.length - maxHistory)
          : updated;
      });
      setPresent(newState);
      setFuture([]);

      lastPushTimeRef.current = now;
    },
    [present, maxHistory, debounceMs],
  );

  const undo = useCallback(() => {
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    setPast((prev) => prev.slice(0, -1));
    setFuture((prev) => [present, ...prev]);
    setPresent(previous);

    // Cancel any ongoing grouping so the next push starts a fresh group
    lastPushTimeRef.current = 0;
  }, [past, present]);

  const redo = useCallback(() => {
    if (future.length === 0) return;

    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setPast((prev) => [...prev, present]);
    setPresent(next);

    // Cancel any ongoing grouping
    lastPushTimeRef.current = 0;
  }, [future, present]);

  const clear = useCallback((initialState: T) => {
    setPast([]);
    setPresent(initialState);
    setFuture([]);
    lastPushTimeRef.current = 0;
  }, []);

  return {
    state: present,
    past,
    future,
    canUndo,
    canRedo,
    pushState,
    undo,
    redo,
    clear,
  };
}
