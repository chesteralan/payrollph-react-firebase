import { useState, useRef, useCallback, useEffect } from "react";

export function useProcessingTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const start = useCallback(() => {
    startRef.current = Date.now();
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setElapsed(0);
  }, [stop]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);

  return {
    elapsed,
    formatted: `${minutes}m ${seconds}s`,
    running,
    start,
    stop,
    reset,
  };
}
