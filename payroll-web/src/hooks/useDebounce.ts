import { useRef, useCallback } from "react";

/**
 * Returns a debounced version of the provided function.
 * The debounced function delays invoking `fn` until after `delay` milliseconds
 * have elapsed since the last time the debounced function was called.
 *
 * @param fn - The function to debounce
 * @param delay - The number of milliseconds to delay
 * @returns A debounced function that accepts the same arguments as `fn`
 *
 * @example
 * ```tsx
 * const handleSearch = useDebounce((query: string) => {
 *   searchAPI(query);
 * }, 300);
 * ```
 */
export function useDebounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay],
  );
}

/**
 * Returns a throttled version of the provided function.
 * The throttled function will only invoke `fn` at most once every `limit` milliseconds.
 * Leading edge only — subsequent calls within the cooldown period are ignored.
 *
 * @param fn - The function to throttle
 * @param limit - The minimum number of milliseconds between invocations
 * @returns A throttled function that accepts the same arguments as `fn`
 *
 * @example
 * ```tsx
 * const handleScroll = useThrottle(() => {
 *   trackScrollPosition();
 * }, 200);
 * ```
 */
export function useThrottle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number,
): (...args: Parameters<T>) => void {
  const inThrottleRef = useRef(false);

  return useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottleRef.current) {
        fn(...args);
        inThrottleRef.current = true;
        setTimeout(() => {
          inThrottleRef.current = false;
        }, limit);
      }
    },
    [fn, limit],
  );
}
