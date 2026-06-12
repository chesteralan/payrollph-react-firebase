import { useCallback } from "react";
import * as Sentry from "@sentry/react";

export function useSentryPerformance() {
  const startTransaction = useCallback((name: string, op?: string) => {
    const transaction = Sentry.startTransaction({ name, op });
    return transaction;
  }, []);

  const createSpan = useCallback(
    (transaction: ReturnType<typeof Sentry.startTransaction>, op: string) => {
      const span = transaction.startChild({ op });
      return span;
    },
    [],
  );

  const finishTransaction = useCallback(
    (transaction: ReturnType<typeof Sentry.startTransaction>, status: "ok" | "error" = "ok") => {
      transaction.setStatus(status);
      transaction.finish();
    },
    [],
  );

  const measureAsync = useCallback(
    async <T>(name: string, fn: () => Promise<T>, op?: string): Promise<T> => {
      const transaction = startTransaction(name, op);
      try {
        const result = await fn();
        finishTransaction(transaction, "ok");
        return result;
      } catch (err) {
        finishTransaction(transaction, "error");
        throw err;
      }
    },
    [startTransaction, finishTransaction],
  );

  return { startTransaction, createSpan, finishTransaction, measureAsync };
}
