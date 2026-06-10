import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/config/firebase";

interface RetentionPolicy {
  collection: string;
  retentionDays: number;
  enabled: boolean;
}

const POLICIES: RetentionPolicy[] = [
  { collection: "system_audit", retentionDays: 365, enabled: true },
  { collection: "analytics_events", retentionDays: 90, enabled: true },
  { collection: "email_queue", retentionDays: 30, enabled: true },
  { collection: "approval_requests", retentionDays: 180, enabled: true },
];

export async function runCleanup(
  policy?: RetentionPolicy,
): Promise<{ deleted: number; collection: string }> {
  const target = policy || POLICIES[0];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - target.retentionDays);

  const snap = await getDocs(
    query(
      collection(db, target.collection),
      where("createdAt", "<", Timestamp.fromDate(cutoff)),
    ),
  );

  const { writeBatch, doc } = await import("firebase/firestore");
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(doc(db, target.collection, d.id)));
  await batch.commit();

  return { deleted: snap.size, collection: target.collection };
}

export async function runAllCleanups(): Promise<{ total: number; details: string[] }> {
  const details: string[] = [];
  let total = 0;
  for (const policy of POLICIES) {
    if (!policy.enabled) continue;
    const result = await runCleanup(policy);
    total += result.deleted;
    details.push(`${result.collection}: ${result.deleted} deleted`);
  }
  return { total, details };
}

export { POLICIES };
