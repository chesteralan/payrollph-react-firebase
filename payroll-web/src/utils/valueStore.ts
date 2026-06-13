/**
 * Minimal observable store for useSyncExternalStore.
 * Provides getSnapshot/subscribe/set for granular subscription-based selectors.
 */
export class ValueStore<T> {
  private value: T;
  private listeners = new Set<() => void>();

  constructor(initial: T) {
    this.value = initial;
  }

  getSnapshot = (): T => this.value;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  set = (newValue: T): void => {
    if (!Object.is(this.value, newValue)) {
      this.value = newValue;
      this.listeners.forEach((l) => l());
    }
  };
}
