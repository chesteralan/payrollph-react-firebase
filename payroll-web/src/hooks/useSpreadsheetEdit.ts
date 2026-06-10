import { useState, useCallback } from "react";

interface CellPosition {
  row: number;
  col: number;
}

export function useSpreadsheetEdit<T extends Record<string, unknown>>(initialData?: T[]) {
  const [data, setData] = useState<T[]>(initialData || []);
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editValue, setEditValue] = useState("");

  const selectCell = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col });
  }, []);

  const startEdit = useCallback((row: number, col: number, currentValue: string) => {
    setEditingCell({ row, col });
    setEditValue(currentValue);
  }, []);

  const commitEdit = useCallback(
    (row: number, field: string, value: string) => {
      setData((prev) => {
        const next = [...prev];
        next[row] = { ...next[row], [field]: value };
        return next;
      });
      setEditingCell(null);
    },
    [],
  );

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
  }, []);

  return {
    data, setData,
    selectedCell, selectCell,
    editingCell, editValue, setEditValue,
    startEdit, commitEdit, cancelEdit,
    isEditing: editingCell !== null,
  };
}
