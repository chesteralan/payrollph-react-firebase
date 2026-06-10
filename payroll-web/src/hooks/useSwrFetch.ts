import { useState, useCallback } from "react";

interface SwrState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  stale: boolean;
}

export function useSwrFetch<T>(key: string) {
  const [state, setState] = useState<SwrState<T>>({
    data: null,
    error: null,
    loading: false,
    stale: false,
  });

  const fetchData = useCallback(
    async (fetcher: () => Promise<T>) => {
      const cached = sessionStorage.getItem(`swr-${key}`);
      if (cached) {
        setState((prev) => ({
          ...prev,
          data: JSON.parse(cached) as T,
          stale: true,
        }));
      }
      setState((prev) => ({ ...prev, loading: true }));
      try {
        const result = await fetcher();
        sessionStorage.setItem(`swr-${key}`, JSON.stringify(result));
        setState({ data: result, error: null, loading: false, stale: false });
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err as Error,
          loading: false,
        }));
      }
    },
    [key],
  );

  const mutate = useCallback(
    async (updater: (prev: T | null) => T) => {
      setState((prev) => {
        const next = updater(prev.data);
        sessionStorage.setItem(`swr-${key}`, JSON.stringify(next));
        return { ...prev, data: next };
      });
    },
    [key],
  );

  return { ...state, fetchData, mutate };
}
