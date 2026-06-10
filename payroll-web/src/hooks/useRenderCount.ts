import { useEffect, useState } from "react";

export function useRenderCount(componentName: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setCount((c) => c + 1);
    /* eslint-enable react-hooks/set-state-in-effect */
  });

  useEffect(() => {
    if (count > 5 && count % 5 === 0) {
      console.warn(`[Perf] ${componentName} rendered ${count} times`);
    }
  }, [count, componentName]);

  return count;
}
