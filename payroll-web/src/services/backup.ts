// -nocheck
// Firestore backup utilities
// Note: Actual backups should be automated via Firebase CLI or Cloud Functions
// This provides client-side backup metadata tracking

import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "../config/firebase";
import type { UserAccount } from "../types";

export interface BackupRecord {
  id: string;
  timestamp: Date;
  collections: string[];
  documentCount: number;
  sizeBytes: number;
  status: "pending" | "completed" | "failed";
  triggeredBy: string;
  backupUrl?: string;
  notes?: string;
}

export const COLLECTIONS_TO_BACKUP = [
  "companies",
  "employees",
  "names",
  "groups",
  "positions",
  "areas",
  "earnings",
  "deductions",
  "benefits",
  "payrolls",
  "templates",
  "user_accounts",
  "user_restrictions",
  "user_companies",
  "user_settings",
  "system_calendar",
  "system_terms",
  "system_audit",
  "ip_restrictions",
];

export const estimateBackupSize = async (): Promise<{
  count: number;
  estimatedSize: number;
}> => {
  let totalDocs = 0;
  let estimatedSize = 0;

  for (const collectionName of COLLECTIONS_TO_BACKUP) {
    try {
      const snap = await getDocs(collection(db, collectionName));
      totalDocs += snap.size;
      // Rough estimate: 2KB per document
      estimatedSize += snap.size * 2048;
    } catch (error) {
      console.warn(`Failed to estimate size for ${collectionName}:`, error);
    }
  }

  return { count: totalDocs, estimatedSize };
};

export const createBackupRecord = async (
  user: UserAccount,
  notes?: string,
): Promise<BackupRecord> => {
  const { count, estimatedSize } = await estimateBackupSize();

  const record: Omit<BackupRecord, "id"> = {
    timestamp: new Date(),
    collections: COLLECTIONS_TO_BACKUP,
    documentCount: count,
    sizeBytes: estimatedSize,
    status: "pending",
    triggeredBy: user.id,
    notes,
  };

  // Store backup record in Firestore
  const batch = writeBatch(db);
  const docRef = doc(collection(db, "backups"));
  const recordWithId = { ...record, id: docRef.id };
  batch.set(docRef, recordWithId);

  await batch.commit();

  return recordWithId as BackupRecord;
};

export const getBackupHistory = async (): Promise<BackupRecord[]> => {
  try {
    const snap = await getDocs(collection(db, "backups"));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as unknown as BackupRecord)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (error) {
    console.error("Failed to fetch backup history:", error);
    return [];
  }
};

export const updateBackupStatus = async (
  backupId: string,
  status: BackupRecord["status"],
  backupUrl?: string,
) => {
  try {
    const docRef = doc(db, "backups", backupId);
    await docRef.update({
      status,
      ...(backupUrl && { backupUrl }),
    });
  } catch (error) {
    console.error("Failed to update backup status:", error);
  }
};

// Instructions for setting up automated backups via Firebase CLI
export const BACKUP_INSTRUCTIONS = `
# Firestore Backup Setup Instructions

## Option 1: Manual Backup via Firebase CLI
firebase firestore:backups create --project=YOUR_PROJECT_ID

## Option 2: Scheduled Backups via Google Cloud
1. Go to Google Cloud Console > Firestore > Backups
2. Enable automated backups
3. Set retention period (7-90 days)
4. Configure backup schedule

## Option 3: Export via gcloud command
gcloud firestore export gs://YOUR_BUCKET_NAME --project=YOUR_PROJECT_ID

## Recommended Backup Strategy:
- Daily incremental backups
- Weekly full backups
- Monthly archives (kept for 1 year)
- Store backups in multi-region bucket
`;

export default {
  createBackupRecord,
  getBackupHistory,
  updateBackupStatus,
  estimateBackupSize,
  COLLECTIONS_TO_BACKUP,
  BACKUP_INSTRUCTIONS,
};
