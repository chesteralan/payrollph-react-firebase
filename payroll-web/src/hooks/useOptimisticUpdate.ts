import { useState, useCallback } from "react";

export function useOptimisticUpdate<T extends Record<string, unknown>>(
  initialData: T[],
) {
  const [data, setData] = useState<T[]>(initialData);

  const optimisticUpdate = useCallback(
    (id: string, updates: Partial<T>, rollbackTimeout = 5000) => {
      const prev = data.find((item) => item.id === id);
      if (!prev) return;

      setData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, ...updates } : item,
        ),
      );

      setTimeout(() => {
        setData((prevData) =>
          prevData.map((item) =>
            item.id === id ? { ...item, ...prev } : item,
          ),
        );
      }, rollbackTimeout);
    },
    [data],
  );

  return { data, setData, optimisticUpdate };
}
