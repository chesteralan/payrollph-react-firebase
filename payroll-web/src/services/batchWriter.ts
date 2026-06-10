import { collection, writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";

export async function batchWriteDocuments<T extends Record<string, unknown>>(
  collectionName: string,
  documents: T[],
  batchSize = 500,
): Promise<string[]> {
  const ids: string[] = [];
  const batches = [];

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = documents.slice(i, i + batchSize);
    for (const docData of chunk) {
      const ref = doc(collection(db, collectionName));
      batch.set(ref, { ...docData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      ids.push(ref.id);
    }
    batches.push(batch.commit());
  }

  await Promise.all(batches);
  return ids;
}

export async function batchDeleteDocuments(
  collectionName: string,
  ids: string[],
  batchSize = 500,
): Promise<void> {
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = ids.slice(i, i + batchSize);
    for (const id of chunk) {
      batch.delete(doc(db, collectionName, id));
    }
    await batch.commit();
  }
}
