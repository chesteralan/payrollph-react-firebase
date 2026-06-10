import { useCallback, useRef } from "react";

export function useCacheInvalidation() {
  const keysRef = useRef<Set<string>>(new Set());

  const registerKey = useCallback((key: string) => {
    keysRef.current.add(key);
  }, []);

  const invalidate = useCallback((pattern?: string) => {
    const keys = pattern
      ? [...keysRef.current].filter((k) => k.includes(pattern))
      : [...keysRef.current];

    keys.forEach((key) => {
      sessionStorage.removeItem(`swr-${key}`);
      sessionStorage.removeItem(`cache-${key}`);
      localStorage.removeItem(`cache-${key}`);
    });
  }, []);

  const invalidateAll = useCallback(() => {
    invalidate();
  }, [invalidate]);

  return { registerKey, invalidate, invalidateAll };
}
