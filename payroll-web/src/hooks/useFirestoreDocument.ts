import { useState, useEffect, useCallback } from "react";
import { getById, type CollectionName } from "@/services/firestore";

/**
 * Return type for the `useFirestoreDocument` hook.
 *
 * @template T - The shape of the fetched document.
 */
interface UseFirestoreDocumentResult<T> {
  /** The document data, or `null` when no document exists / hasn't loaded yet. */
  data: T | null;
  /** Whether a fetch is currently in-flight. */
  loading: boolean;
  /** Non-null if the last fetch failed. */
  error: Error | null;
  /** Manually re-fetch the document. */
  refetch: () => void;
}

/**
 * React hook that wraps `firestore.ts::getById` with loading / error states.
 *
 * ---
 *
 * @example
 * ```tsx
 * const { data: company, loading, error } = useFirestoreDocument<Company>(
 *   "companies",
 *   companyId,
 * );
 * ```
 *
 * @param collectionName - A valid Firestore collection name.
 * @param id             - The document ID to fetch.  When `null` or `undefined`
 *                         the hook will skip the fetch (useful when the ID is
 *                         still being resolved).
 * @param deps           - (Advanced) Extra dependency values that trigger a
 *                         refetch when changed.  Defaults to `[collectionName, id]`.
 *
 * @returns An object with `data`, `loading`, `error`, and `refetch`.
 */
export function useFirestoreDocument<T>(
  collectionName: CollectionName,
  id: string | null | undefined,
  deps?: unknown[],
): UseFirestoreDocumentResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getById<T>(collectionName, id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [collectionName, id]);

  // Automatically fetch on mount and when any dependency changes.
  useEffect(() => {
    fetchData();
  }, [fetchData, ...(deps ?? [])]);

  return { data, loading, error, refetch: fetchData };
}
