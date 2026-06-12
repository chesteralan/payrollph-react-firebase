import { useCallback } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";

export function useFirestoreLogging() {
  const logOperation = useCallback(
    async (operation: string, collectionName: string, documentId?: string, metadata?: Record<string, unknown>) => {
      try {
        await addDoc(collection(db, "operation_logs"), {
          operation,
          collection: collectionName,
          documentId: documentId || null,
          metadata: metadata || {},
          timestamp: serverTimestamp(),
        });
      } catch (err) {
        console.error("Failed to log Firestore operation:", err);
      }
    },
    [],
  );

  const createLoggingMiddleware = useCallback(() => {
    return {
      beforeWrite: (collectionName: string, data: unknown) => {
        logOperation("write", collectionName, undefined, { dataSize: JSON.stringify(data).length });
      },
      beforeRead: (collectionName: string, docId?: string) => {
        logOperation("read", collectionName, docId);
      },
      beforeDelete: (collectionName: string, docId: string) => {
        logOperation("delete", collectionName, docId);
      },
    };
  }, [logOperation]);

  return { logOperation, createLoggingMiddleware };
}
