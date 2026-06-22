import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

/** Error grouping rules by error type — maps error fingerprints to grouping keys */
export const ERROR_GROUPS = {
  NETWORK: "network-error",
  AUTH: "auth-error",
  FIRESTORE: "firestore-error",
  PAYROLL: "payroll-error",
  PERMISSION: "permission-error",
  VALIDATION: "validation-error",
  UNKNOWN: "unknown-error",
} as const;

export type ErrorGroup = (typeof ERROR_GROUPS)[keyof typeof ERROR_GROUPS];

/**
 * Classify an error into a grouping category for alerting and dashboard aggregation.
 * Uses error message patterns and context hints to determine the group.
 */
export function classifyError(
  error: Error,
  context?: Record<string, unknown>,
): ErrorGroup {
  const msg = error.message?.toLowerCase() ?? "";
  const name = error.name?.toLowerCase() ?? "";
  const ctx = context ?? {};

  if (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("offline") ||
    msg.includes("timeout") ||
    msg.includes("abort") ||
    name === "networkerror"
  ) {
    return ERROR_GROUPS.NETWORK;
  }
  if (
    msg.includes("auth") ||
    msg.includes("unauthorized") ||
    msg.includes("unauthenticated") ||
    msg.includes("permission denied") ||
    msg.includes("token") ||
    name === "firebaseerror" &&
      (msg.includes("auth/") || msg.includes("permission-denied"))
  ) {
    return ERROR_GROUPS.AUTH;
  }
  if (
    name === "firebaseerror" ||
    msg.includes("firestore") ||
    msg.includes("firebase") ||
    msg.includes("document") ||
    msg.includes("collection") ||
    ctx.source === "firestore"
  ) {
    return ERROR_GROUPS.FIRESTORE;
  }
  if (
    msg.includes("payroll") ||
    msg.includes("salary") ||
    msg.includes("wage") ||
    msg.includes("computation") ||
    msg.includes("deduction") ||
    ctx.source === "payroll"
  ) {
    return ERROR_GROUPS.PAYROLL;
  }
  if (
    msg.includes("permission") ||
    msg.includes("role") ||
    msg.includes("rbac") ||
    msg.includes("access denied") ||
    msg.includes("forbidden")
  ) {
    return ERROR_GROUPS.PERMISSION;
  }
  if (
    msg.includes("validation") ||
    msg.includes("invalid") ||
    msg.includes("required") ||
    msg.includes("malformed") ||
    name === "typeerror" ||
    name === "referenceerror"
  ) {
    return ERROR_GROUPS.VALIDATION;
  }
  return ERROR_GROUPS.UNKNOWN;
}

export const initSentry = () => {
  if (!SENTRY_DSN) {
    if (import.meta.env.DEV) {
      console.warn("Sentry DSN not configured. Error tracking disabled.");
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration({
        traceFetch: true,
        traceXHR: true,
      }),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || "unknown",
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Don't send events in development
      if (import.meta.env.DEV) {
        return null;
      }

      // Add error grouping fingerprint
      if (event.exception?.values?.[0]) {
        const exc = event.exception.values[0];
        const error = new Error(exc.value ?? "Unknown");
        const group = classifyError(error, event.extra as Record<string, unknown> | undefined);

        // Apply fingerprint for grouping
        event.fingerprint = [group, exc.type ?? "Error"].filter(Boolean);
        event.tags = {
          ...event.tags,
          error_group: group,
        };
      }

      return event;
    },
    initialScope: {
      tags: {
        component: "payroll-web",
      },
    },
  });
};

export const captureException = (
  error: Error,
  context?: Record<string, unknown>,
) => {
  const group = classifyError(error, context);
  Sentry.captureException(error, {
    extra: { ...context, error_group: group },
    tags: { error_group: group },
  });
};

export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = "info",
) => {
  Sentry.captureMessage(message, level);
};

export const setUserContext = (user: {
  id: string;
  email?: string;
  username?: string;
}) => {
  Sentry.setUser(user);
};

export const clearUserContext = () => {
  Sentry.setUser(null);
};

export default Sentry;
