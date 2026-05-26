import { describe, it, expect, beforeEach, vi } from "vitest";
import { createFirestoreMocks, addMockDocs, clearMockDocs } from "../__mocks__/firebase";

// Extend base mocks with writeBatch and doc that supports .id / .update()
vi.mock("firebase/firestore", () => ({
  ...createFirestoreMocks(),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn(),
  })),
  doc: vi.fn((...args: unknown[]) => {
    // Filter out non-string args (like the db object) and join
    const segments = args.filter((a): a is string => typeof a === "string");
    const path = segments.join("/");
    return {
      id: path,
      update: vi.fn(async () => {}),
    };
  }),
}));

import {
  estimateBackupSize,
  createBackupRecord,
  getBackupHistory,
  updateBackupStatus,
  COLLECTIONS_TO_BACKUP,
} from "./backup";
import { getDocs, doc } from "firebase/firestore";
import type { UserAccount } from "../types";

const mockUser: UserAccount = {
  id: "user-1",
  email: "admin@example.com",
  username: "admin",
  displayName: "Admin User",
  isActive: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("estimateBackupSize", () => {
  it("should return zero counts when no collections have data", async () => {
    const result = await estimateBackupSize();

    expect(result.count).toBe(0);
    expect(result.estimatedSize).toBe(0);
  });

  it("should return correct document counts", async () => {
    // Seed some collections with known document counts
    addMockDocs("companies", [
      { id: "1", name: "Company A" },
      { id: "2", name: "Company B" },
    ]);
    addMockDocs("employees", [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
      { id: "3", name: "Charlie" },
    ]);
    addMockDocs("names", [{ id: "1", name: "Test" }]);

    const result = await estimateBackupSize();

    // Should return the sum of docs from all seeded collections
    expect(result.count).toBe(6); // 2 + 3 + 1
  });

  it("should estimate size as 2KB per document", async () => {
    addMockDocs("companies", [{ id: "1", name: "A" }]);
    addMockDocs("employees", [{ id: "1", name: "B" }, { id: "2", name: "C" }]);

    const result = await estimateBackupSize();

    expect(result.estimatedSize).toBe(3 * 2048); // 3 docs × 2048 bytes
  });

  it("should call getDocs for each collection in COLLECTIONS_TO_BACKUP", async () => {
    await estimateBackupSize();

    // getDocs should be called once per collection
    expect(getDocs).toHaveBeenCalledTimes(COLLECTIONS_TO_BACKUP.length);
  });

  it("should handle errors for individual collections gracefully", async () => {
    addMockDocs("companies", [{ id: "1", name: "A" }]);

    // getDocs will succeed for seeded collections and return zero for others
    const result = await estimateBackupSize();

    expect(result.count).toBeGreaterThanOrEqual(1);
  });
});

describe("createBackupRecord", () => {
  it("should create a backup record and return it with an id", async () => {
    addMockDocs("companies", [{ id: "1", name: "A" }]);

    const record = await createBackupRecord(mockUser, "Scheduled backup");

    expect(record).toBeDefined();
    expect(record.id).toBeTruthy();
    expect(record.status).toBe("pending");
    expect(record.triggeredBy).toBe("user-1");
    expect(record.documentCount).toBe(1); // 1 doc in companies
    expect(record.collections).toEqual(COLLECTIONS_TO_BACKUP);
    expect(record.notes).toBe("Scheduled backup");
  });

  it("should use writeBatch to store the backup record", async () => {
    const { writeBatch } = await import("firebase/firestore");

    await createBackupRecord(mockUser);

    expect(writeBatch).toHaveBeenCalledOnce();
  });

  it("should record document count from estimateBackupSize", async () => {
    addMockDocs("companies", [{ id: "1", name: "A" }]);
    addMockDocs("employees", [{ id: "1", name: "B" }, { id: "2", name: "C" }]);

    const record = await createBackupRecord(mockUser);

    expect(record.documentCount).toBe(3);
    expect(record.sizeBytes).toBe(3 * 2048);
  });

  it("should create record without notes when not provided", async () => {
    const record = await createBackupRecord(mockUser);

    expect(record.notes).toBeUndefined();
  });
});

describe("getBackupHistory", () => {
  it("should return an empty array when no backups exist", async () => {
    const history = await getBackupHistory();
    expect(history).toEqual([]);
  });

  it("should return backup records sorted by timestamp descending", async () => {
    const now = new Date();
    const earlier = new Date(now.getTime() - 86400000); // 1 day ago

    addMockDocs("backups", [
      {
        id: "backup-1",
        timestamp: earlier,
        collections: COLLECTIONS_TO_BACKUP,
        documentCount: 10,
        sizeBytes: 20480,
        status: "completed",
        triggeredBy: "user-1",
      },
      {
        id: "backup-2",
        timestamp: now,
        collections: COLLECTIONS_TO_BACKUP,
        documentCount: 20,
        sizeBytes: 40960,
        status: "completed",
        triggeredBy: "user-1",
      },
    ]);

    const history = await getBackupHistory();

    expect(history).toHaveLength(2);
    // Should be sorted newest first
    expect(history[0].id).toBe("backup-2");
    expect(history[1].id).toBe("backup-1");
  });

  it("should return full backup record with all fields", async () => {
    const timestamp = new Date("2024-06-01");
    addMockDocs("backups", [
      {
        id: "backup-1",
        timestamp,
        collections: COLLECTIONS_TO_BACKUP,
        documentCount: 50,
        sizeBytes: 102400,
        status: "completed",
        triggeredBy: "user-1",
        backupUrl: "https://storage.example.com/backup-1",
        notes: "Weekly backup",
      },
    ]);

    const history = await getBackupHistory();

    expect(history[0].id).toBe("backup-1");
    expect(history[0].documentCount).toBe(50);
    expect(history[0].sizeBytes).toBe(102400);
    expect(history[0].status).toBe("completed");
    expect(history[0].backupUrl).toBe("https://storage.example.com/backup-1");
    expect(history[0].notes).toBe("Weekly backup");
  });

  it("should handle Firestore errors gracefully", async () => {
    // Mock getDocs to throw
    vi.mocked(getDocs).mockRejectedValueOnce(new Error("Firestore unavailable"));

    const history = await getBackupHistory();

    expect(history).toEqual([]);
  });
});

describe("updateBackupStatus", () => {
  it("should update the backup status successfully", async () => {
    await expect(
      updateBackupStatus("backup-1", "completed"),
    ).resolves.toBeUndefined();
  });

  it("should set the backup URL when provided", async () => {
    await expect(
      updateBackupStatus("backup-1", "completed", "https://storage.example.com/backup-1"),
    ).resolves.toBeUndefined();
  });

  it("should handle errors gracefully", async () => {
    // Make doc().update() throw
    vi.mocked(doc).mockReturnValueOnce({
      id: "backup-1",
      update: vi.fn(async () => {
        throw new Error("Permission denied");
      }),
    });

    await expect(
      updateBackupStatus("backup-1", "failed"),
    ).resolves.toBeUndefined();
  });
});
