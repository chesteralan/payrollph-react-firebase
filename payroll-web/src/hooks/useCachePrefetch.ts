import { useEffect } from "react";
import { collection, query, getDocs, type QueryConstraint } from "firebase/firestore";
import { db } from "@/config/firebase";
import { cache } from "@/utils/dataCache";

export function useCachePrefetch(
  key: string,
  collectionName: string,
  constraints: QueryConstraint[] = [],
) {
  useEffect(() => {
    if (cache.get(key)) return;
    const prefetch = async () => {
      const snap = await getDocs(query(collection(db, collectionName), ...constraints));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      cache.set(key, data, 5 * 60 * 1000);
    };
    prefetch();
  }, [key, collectionName, constraints]);
}
