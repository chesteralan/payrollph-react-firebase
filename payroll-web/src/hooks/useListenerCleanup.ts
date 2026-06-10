import { useEffect, useRef } from "react";

export function useListenerCleanup() {
  const listenersRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    return () => {
      listenersRef.current.forEach((cleanup) => cleanup());
      listenersRef.current = [];
    };
  }, []);

  const addListener = (cleanup: () => void) => {
    listenersRef.current.push(cleanup);
  };

  return { addListener };
}
