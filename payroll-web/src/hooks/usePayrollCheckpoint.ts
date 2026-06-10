import { useCallback } from "react";

interface Checkpoint {
  stage: string;
  timestamp: number;
  data: unknown;
}

export function usePayrollCheckpoint(payrollId: string) {
  const key = `payroll-checkpoint-${payrollId}`;

  const save = useCallback(
    (stage: string, data: unknown) => {
      const checkpoint: Checkpoint = { stage, timestamp: Date.now(), data };
      localStorage.setItem(key, JSON.stringify(checkpoint));
    },
    [key],
  );

  const restore = useCallback((): Checkpoint | null => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, [key]);

  const clear = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  const autoSave = useCallback(
    (stage: string, data: unknown) => {
      save(stage, data);
    },
    [save],
  );

  return { save, restore, clear, autoSave };
}
