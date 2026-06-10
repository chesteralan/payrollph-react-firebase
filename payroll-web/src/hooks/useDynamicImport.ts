import { useState, useEffect, type ComponentType } from "react";

export function useDynamicImport(
  importFn: () => Promise<{ default: ComponentType<unknown> }>,
) {
  const [Component, setComponent] = useState<ComponentType<unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    importFn()
      .then((mod) => {
        if (!cancelled) {
          setComponent(mod.default);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err as Error);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [importFn]);

  return { Component, loading, error };
}
