import { lazy, type ComponentType } from "react";

interface SplitModule {
  default: ComponentType<unknown>;
}

export function createSplitComponent(
  importFn: () => Promise<SplitModule>,
  componentName: string,
) {
  const LazyComponent = lazy(importFn);
  LazyComponent.displayName = `Lazy${componentName}`;
  return LazyComponent;
}

export function createSplitHook<T>(importFn: () => Promise<{ default: T }>) {
  let cachedHook: T | null = null;
  let loading = false;
  const pending: Array<(hook: T) => void> = [];

  return {
    getHook: async (): Promise<T> => {
      if (cachedHook) return cachedHook;
      if (loading) {
        return new Promise((resolve) => pending.push(resolve));
      }
      loading = true;
      const mod = await importFn();
      cachedHook = mod.default;
      loading = false;
      pending.forEach((resolve) => resolve(cachedHook!));
      pending.length = 0;
      return cachedHook;
    },
  };
}
