import { useEffect } from "react";

export function usePerformanceMark(name: string) {
  useEffect(() => {
    performance.mark(`${name}-start`);
    return () => {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    };
  }, [name]);
}
