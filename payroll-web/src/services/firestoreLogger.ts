/**
 * Custom logging middleware for Firestore operations
 *
 * Wraps Firestore read/write operations with:
 * - Performance tracking
 * - Error monitoring via Sentry
 * - Audit trail breadcrumbs
 * - Operation timing
 */
import * as Sentry from "@sentry/react";
import type { FirebaseError } from "firebase/app";

// Types for operation logging
type FirestoreOperation = "get" | "set" | "update" | "delete" | "add" | "list" | "onSnapshot";

interface OperationLog {
  operation: FirestoreOperation;
  collection: string;
  docId?: string;
  durationMs: number;
  success: boolean;
  timestamp: number;
  error?: string;
}

// Operation store for batching and reporting
const operationLogs: OperationLog[] = [];
const MAX_LOGS_BEFORE_FLUSH = 50;

/**
 * Log a Firestore operation for monitoring and debugging
 */
export function logFirestoreOperation(
  operation: FirestoreOperation,
  collection: string,
  options: {
    docId?: string;
    durationMs?: number;
    success?: boolean;
    error?: unknown;
  } = {},
) {
  const log: OperationLog = {
    operation,
    collection,
    docId: options.docId,
    durationMs: options.durationMs ?? 0,
    success: options.success ?? true,
    timestamp: Date.now(),
    error: options.error ? String(options.error) : undefined,
  };

  // Add breadcrumb for Sentry context
  Sentry.addBreadcrumb({
    category: "firestore",
    message: `${operation} ${collection}${options.docId ? `/${options.docId}` : ""}`,
    level: options.success ? "info" : "error",
    data: {
      durationMs: options.durationMs,
      error: options.error,
    },
  });

  // Track slow operations (> 1 second)
  if (options.durationMs && options.durationMs > 1000) {
    Sentry.captureMessage(
      `Slow Firestore operation: ${operation} ${collection} (${options.durationMs}ms)`,
      "warning",
    );
  }

  // Track failures
  if (!options.success && options.error) {
    const error =
      options.error instanceof Error ? options.error : new Error(String(options.error));
    Sentry.captureException(error, {
      extra: {
        operation,
        collection,
        docId: options.docId,
        durationMs: options.durationMs,
      },
      tags: {
        firestore_operation: operation,
        firestore_collection: collection,
      },
    });
  }

  // Store for batch reporting
  operationLogs.push(log);
  if (operationLogs.length >= MAX_LOGS_BEFORE_FLUSH) {
    flushOperationLogs();
  }
}

/**
 * Flush accumulated operation logs to Sentry
 */
export function flushOperationLogs() {
  if (operationLogs.length === 0) return;

  const slowOps = operationLogs.filter((l) => l.durationMs > 1000);
  const failedOps = operationLogs.filter((l) => !l.success);

  if (slowOps.length > 0) {
    Sentry.captureMessage(
      `${slowOps.length} slow Firestore operations detected in batch`,
      "warning",
    );
  }

  if (failedOps.length > 0) {
    Sentry.captureMessage(
      `${failedOps.length} failed Firestore operations in batch`,
      "error",
    );
  }

  operationLogs.length = 0;
}

/**
 * Create a Firestore query wrapper with logging
 *
 * Usage:
 *   const trackedGet = withLogging(firestoreService.getDoc, 'get', 'employees');
 *   const result = await trackedGet('docId');
 */
export function withLogging<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  operation: FirestoreOperation,
  collection: string,
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const startTime = performance.now();
    try {
      const result = await fn(...args);
      const durationMs = performance.now() - startTime;
      logFirestoreOperation(operation, collection, {
        durationMs,
        success: true,
      });
      return result as Awaited<ReturnType<T>>;
    } catch (error) {
      const durationMs = performance.now() - startTime;
      logFirestoreOperation(operation, collection, {
        durationMs,
        success: false,
        error,
      });
      throw error;
    }
  };
}

/**
 * Track the number of Firestore reads/writes per page view
 * Useful for monitoring Firestore budget usage
 */
let readCount = 0;
let writeCount = 0;
let deleteCount = 0;

export function trackRead() {
  readCount++;
}

export function trackWrite() {
  writeCount++;
}

export function trackDelete() {
  deleteCount++;
}

export function getFirestoreUsageStats() {
  return {
    reads: readCount,
    writes: writeCount,
    deletes: deleteCount,
    total: readCount + writeCount + deleteCount,
  };
}

export function resetUsageStats() {
  readCount = 0;
  writeCount = 0;
  deleteCount = 0;
}
