import { useCallback } from "react";

export function useSentryMonitoring() {
  const captureError = useCallback((error: Error, context?: Record<string, unknown>) => {
    try {
      const Sentry = (window as unknown as Record<string, unknown>).Sentry as {
        captureException?: (err: Error, ctx: { extra: Record<string, unknown> }) => void;
      } | undefined;
      if (Sentry?.captureException) {
        Sentry.captureException(error, { extra: context || {} });
      }
    } catch {
      // Sentry not available
    }
  }, []);

  const captureMessage = useCallback((message: string, level = "info") => {
    try {
      const Sentry = (window as unknown as Record<string, unknown>).Sentry as {
        captureMessage?: (msg: string, lvl: { level: string }) => void;
      } | undefined;
      if (Sentry?.captureMessage) {
        Sentry.captureMessage(message, { level });
      }
    } catch {
      // Sentry not available
    }
  }, []);

  return { captureError, captureMessage };
}
