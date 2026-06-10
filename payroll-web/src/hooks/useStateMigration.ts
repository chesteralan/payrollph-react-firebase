import { useState, useCallback } from "react";

interface StateSnapshot {
  id: string;
  label: string;
  state: unknown;
  timestamp: number;
}

export function useStateMigration() {
  const [snapshots, setSnapshots] = useState<StateSnapshot[]>([]);

  const createSnapshot = useCallback(
    (id: string, label: string, state: unknown) => {
      setSnapshots((prev) => [
        ...prev,
        { id, label, state, timestamp: Date.now() },
      ]);
    },
    [],
  );

  const restoreSnapshot = useCallback(
    (id: string): unknown | null => {
      const snapshot = snapshots.find((s) => s.id === id);
      return snapshot ? snapshot.state : null;
    },
    [snapshots],
  );

  const clearSnapshots = useCallback(() => setSnapshots([]), []);

  return { snapshots, createSnapshot, restoreSnapshot, clearSnapshots };
}
