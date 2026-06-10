import { useState, useCallback, useEffect } from "react";

export function useUnsavedChanges(initialDirty = false) {
  const [isDirty, setIsDirty] = useState(initialDirty);

  const markDirty = useCallback(() => setIsDirty(true), []);
  const markClean = useCallback(() => setIsDirty(false), []);

  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  return { isDirty, markDirty, markClean };
}
