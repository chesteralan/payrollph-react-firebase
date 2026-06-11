import { useCallback, useRef } from "react";
import { useUndoManager } from "@/hooks/useUndoManager";
import { useToast } from "@/hooks/useToast";
import type { UndoManager } from "@/hooks/useUndoManager";

// ── Types ─────────────────────────────────────────────────────────────

export interface PayrollData {
  id: string;
  name: string;
  month: string;
  year: number;
  status: string;
  [key: string]: unknown;
}

export interface EmployeeData {
  id: string;
  name: string;
  status: string;
  department: string;
  position: string;
  [key: string]: unknown;
}

export interface PayrollUndoResult extends UndoManager<PayrollData> {
  /** Push state with an optional description shown in the toast */
  pushTracked: (snapshot: PayrollData, description?: string) => void;
}

export interface EmployeeUndoResult extends UndoManager<EmployeeData> {
  /** Push state with an optional description shown in the toast */
  pushTracked: (snapshot: EmployeeData, description?: string) => void;
}

// ── Payroll Undo Hook ─────────────────────────────────────────────────

/**
 * Hook for undo/redo support in payroll edit workflows.
 * Integrates with the toast notification system to show feedback
 * on undo/redo actions.
 */
export function usePayrollUndo(
  initialData: PayrollData,
  maxHistory = 50,
): PayrollUndoResult {
  const { addToast } = useToast();
  const undoManager = useUndoManager(initialData, maxHistory);
  const descriptionRef = useRef<string>("");

  const undo = useCallback(() => {
    if (!undoManager.canUndo) return;
    undoManager.undo();
    addToast({
      type: "info",
      title: "Undo",
      message: "Payroll change undone",
      duration: 3000,
    });
  }, [undoManager, addToast]);

  const redo = useCallback(() => {
    if (!undoManager.canRedo) return;
    undoManager.redo();
    addToast({
      type: "info",
      title: "Redo",
      message: "Payroll change reapplied",
      duration: 3000,
    });
  }, [undoManager, addToast]);

  const pushTracked = useCallback(
    (snapshot: PayrollData, description?: string) => {
      descriptionRef.current = description || "Payroll updated";
      undoManager.pushState(snapshot);
    },
    [undoManager],
  );

  return {
    ...undoManager,
    undo,
    redo,
    pushTracked,
  };
}

// ── Employee Undo Hook ────────────────────────────────────────────────

/**
 * Hook for undo/redo support in employee edit workflows.
 * Integrates with the toast notification system to show feedback
 * on undo/redo actions.
 */
export function useEmployeeUndo(
  initialData: EmployeeData,
  maxHistory = 50,
): EmployeeUndoResult {
  const { addToast } = useToast();
  const undoManager = useUndoManager(initialData, maxHistory);
  const descriptionRef = useRef<string>("");

  const undo = useCallback(() => {
    if (!undoManager.canUndo) return;
    undoManager.undo();
    addToast({
      type: "info",
      title: "Undo",
      message: "Employee change undone",
      duration: 3000,
    });
  }, [undoManager, addToast]);

  const redo = useCallback(() => {
    if (!undoManager.canRedo) return;
    undoManager.redo();
    addToast({
      type: "info",
      title: "Redo",
      message: "Employee change reapplied",
      duration: 3000,
    });
  }, [undoManager, addToast]);

  const pushTracked = useCallback(
    (snapshot: EmployeeData, description?: string) => {
      descriptionRef.current = description || "Employee updated";
      undoManager.pushState(snapshot);
    },
    [undoManager],
  );

  return {
    ...undoManager,
    undo,
    redo,
    pushTracked,
  };
}
