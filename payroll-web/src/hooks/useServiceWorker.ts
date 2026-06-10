import { useEffect, useCallback, useState } from "react";

export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setSupported("serviceWorker" in navigator);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const register = useCallback(async (swUrl = "/service-worker.js") => {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service workers not supported");
      return null;
    }
    try {
      const reg = await navigator.serviceWorker.register(swUrl);
      setRegistration(reg);
      return reg;
    } catch (err) {
      console.error("SW registration failed:", err);
      return null;
    }
  }, []);

  const unregister = useCallback(async () => {
    if (registration) {
      await registration.unregister();
      setRegistration(null);
    }
  }, [registration]);

  return { register, unregister, registration, supported };
}
