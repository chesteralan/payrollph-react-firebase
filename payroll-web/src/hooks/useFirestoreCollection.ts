import { useState, useEffect, useCallback } from "react";
import { getAll, type CollectionName } from "@/services/firestore";

/**
 * Filter clause for Firestore queries.
 * Mirrors the `filters` parameter type from `firestore.ts::getAll`.
 */
interface FilterClause {
  field: string;
  op: "==" | "!=" | ">" | "<" | ">=" | "<=" | "array-contains";
  value: unknown;
}

/**
 * Order clause for Firestore queries.
 * Mirrors the `order` parameter type from `firestore.ts::getAll`.
 */
interface OrderClause {
  field: string;
  direction: "asc" | "desc";
}

/**
 * Return type for the `useFirestoreCollection` hook.
 *
 * @template T - The shape of each document in the collection.
 */
interface UseFirestoreCollectionResult<T> {
  /** Array of documents returned from the query. */
  data: T[];
  /** Whether a fetch is currently in-flight. */
  loading: boolean;
  /** Non-null if the last fetch failed. */
  error: Error | null;
  /** Manually re-trigger the fetch.  Re-runs the same filters/order/limit. */
  refetch: () => void;
}

/**
 * React hook that wraps `firestore.ts::getAll` with loading / error states.
 *
 * ---
 *
 * @example
 * ```tsx
 * const { data: employees, loading, error, refetch } = useFirestoreCollection<Employee>(
 *   "employees",
 *   [{ field: "companyId", op: "==", value: currentCompanyId }],
 *   { field: "createdAt", direction: "desc" },
 *   100,
 * );
 * ```
 *
 * @param collectionName - A valid Firestore collection name (type‑checked via `CollectionName`).
 * @param filters        - Optional array of `where` clauses.
 * @param order          - Optional sort order.
 * @param maxLimit       - Optional maximum number of documents to return.
 * @param deps           - (Advanced) Extra dependency values that trigger a refetch when changed.
 *                         Defaults to `[collectionName, filters, order, maxLimit]`
 *                         so the hook re-runs automatically when any query parameter changes.
 *
 * @returns An object with `data`, `loading`, `error`, and `refetch`.
 */
export function useFirestoreCollection<T>(
  collectionName: CollectionName,
  filters?: FilterClause[],
  order?: OrderClause,
  maxLimit?: number,
  deps?: unknown[],
): UseFirestoreCollectionResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Stable serialisation for dependency tracking.
  // We use JSON.stringify so that two structurally equal arrays (but different
  // references) still trigger a refetch correctly.
  const filtersKey = JSON.stringify(filters);
  const orderKey = JSON.stringify(order);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAll<T>(collectionName, filters, order, maxLimit);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [collectionName, filtersKey, orderKey, maxLimit]);

  // Automatically fetch on mount and when any query parameter changes.
  useEffect(() => {
    fetchData();
  }, [fetchData, ...(deps ?? [])]);

  return { data, loading, error, refetch: fetchData };
}
