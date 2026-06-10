import { useRef, useCallback } from "react";

export function useStaleWhileRevalidate<T>(key: string) {
  const cacheRef = useRef<{ data: T; timestamp: number } | null>(null);

  const getData = useCallback((): { data: T | null; stale: boolean } => {
    const cached = cacheRef.current;
    if (!cached) return { data: null, stale: false };
    const stale = Date.now() - cached.timestamp > 30000;
    return { data: cached.data, stale };
  }, []);

  const setData = useCallback((data: T) => {
    cacheRef.current = { data, timestamp: Date.now() };
    sessionStorage.setItem(`swr-${key}`, JSON.stringify(data));
  }, [key]);

  const revalidate = useCallback(
    async (fetchFn: () => Promise<T>): Promise<T> => {
      const cached = sessionStorage.getItem(`swr-${key}`);
      if (cached) {
        try {
          cacheRef.current = { data: JSON.parse(cached) as T, timestamp: 0 };
        } catch { /* ignore */ }
      }
      const fresh = await fetchFn();
      setData(fresh);
      return fresh;
    },
    [key, setData],
  );

  return { getData, setData, revalidate };
}
