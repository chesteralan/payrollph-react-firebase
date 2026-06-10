import { useCallback, useEffect, useRef } from "react";

export function useBackgroundDataRefresh(
  fetchFn: () => Promise<void>,
  intervalMs = 30000,
) {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const mountedRef = useRef(true);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    intervalRef.current = setInterval(async () => {
      if (mountedRef.current) await fetchFn();
    }, intervalMs);
  }, [fetchFn, intervalMs, stop]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stop();
    };
  }, [stop]);

  return { start, stop };
}
