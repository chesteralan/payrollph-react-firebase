import { useCallback } from "react";
import * as Sentry from "@sentry/react";

export function useErrorGrouping() {
  const captureAndGroup = useCallback(
    (error: Error, fingerprint?: string[], context?: Record<string, unknown>) => {
      Sentry.withScope((scope) => {
        if (fingerprint) {
          scope.setFingerprint(fingerprint);
        }
        if (context) {
          scope.setExtras(context);
        }
        Sentry.captureException(error);
      });
    },
    [],
  );

  const setErrorLevel = useCallback((level: "fatal" | "error" | "warning" | "info") => {
    Sentry.configureScope((scope) => {
      scope.setLevel(level);
    });
  }, []);

  return { captureAndGroup, setErrorLevel };
}
