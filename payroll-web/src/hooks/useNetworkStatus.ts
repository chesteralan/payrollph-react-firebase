import { useState, useEffect } from "react";

/**
 * Hook that tracks the browser's online/offline status.
 * Listens to the `online` and `offline` window events and returns the current
 * connectivity state.
 *
 * @returns An object with `isOnline` and `isOffline` boolean flags.
 * Exactly one is always `true`.
 *
 * @example
 * ```tsx
 * const { isOnline, isOffline } = useNetworkStatus();
 * if (isOffline) return <OfflineBanner message="You are offline" />;
 * ```
 */
export function useNetworkStatus(): { isOnline: boolean; isOffline: boolean } {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, isOffline: !isOnline };
}
