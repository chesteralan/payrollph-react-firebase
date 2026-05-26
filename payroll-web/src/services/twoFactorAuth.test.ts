import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createFirestoreMocks,
  addMockDocs,
  clearMockDocs,
  createAuthMocks,
} from "../__mocks__/firebase";

// Mock firebase/firestore with setDoc + getDoc support
vi.mock("firebase/firestore", () => ({
  ...createFirestoreMocks(),
  setDoc: vi.fn(async () => {}),
  getDoc: vi.fn(async (docPath: string) => {
    const { getMockDocs } = await import("../__mocks__/firebase");
    const docs = getMockDocs(docPath);
    const doc = docs?.[0];
    if (doc) {
      return { id: doc.id, exists: () => true, data: () => doc };
    }
    return { id: docPath, exists: () => false, data: () => null };
  }),
  doc: vi.fn((...args: unknown[]) => {
    const segments = args.filter((a): a is string => typeof a === "string");
    return segments.join("/");
  }),
}));

// Mock firebase/auth
vi.mock("firebase/auth", () => ({
  ...createAuthMocks(),
  multiFactor: vi.fn(() => ({
    getSession: vi.fn().mockResolvedValue({}),
    enrollments: [],
    enroll: vi.fn().mockResolvedValue(undefined),
    unenroll: vi.fn().mockResolvedValue(undefined),
  })),
  TotpMultiFactorGenerator: {
    generateSecret: vi.fn().mockResolvedValue({
      otpAuthUri: "otpauth://totp/test?secret=TEST123",
      sharedSecretKey: "TEST123",
    }),
    assertionForSignIn: vi.fn(),
    assertionForEnrollment: vi.fn(),
  },
  PhoneAuthProvider: vi.fn(() => ({
    verifyPhoneNumber: vi.fn().mockResolvedValue("verification-id-123"),
  })),
  PhoneMultiFactorGenerator: {
    assertion: vi.fn(),
  },
}));

import {
  getTwoFactorStatus,
  generateBackupCodes,
  verifyBackupCode,
} from "./twoFactorAuth";
import { getDoc, updateDoc } from "firebase/firestore";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("getTwoFactorStatus", () => {
  it("should return disabled status when user doc does not exist", async () => {
    const status = await getTwoFactorStatus("nonexistent-user");

    expect(status.isEnabled).toBe(false);
    expect(status.method).toBeUndefined();
    expect(status.enrollmentDate).toBeUndefined();
  });

  it("should return disabled status when twoFactorEnabled is false", async () => {
    addMockDocs("user_accounts/user-1", [
      {
        id: "user-1",
        email: "user@example.com",
        twoFactorEnabled: false,
      },
    ]);

    const status = await getTwoFactorStatus("user-1");

    expect(status.isEnabled).toBe(false);
  });

  it("should return enabled status with TOTP method", async () => {
    addMockDocs("user_accounts/user-1", [
      {
        id: "user-1",
        email: "user@example.com",
        twoFactorEnabled: true,
        twoFactorMethod: "totp",
        twoFactorEnrolledAt: { toDate: () => new Date("2024-06-01") },
      },
    ]);

    const status = await getTwoFactorStatus("user-1");

    expect(status.isEnabled).toBe(true);
    expect(status.method).toBe("totp");
    expect(status.enrollmentDate).toBeDefined();
  });

  it("should return enabled status with phone method", async () => {
    addMockDocs("user_accounts/user-2", [
      {
        id: "user-2",
        email: "user2@example.com",
        twoFactorEnabled: true,
        twoFactorMethod: "phone",
      },
    ]);

    const status = await getTwoFactorStatus("user-2");

    expect(status.isEnabled).toBe(true);
    expect(status.method).toBe("phone");
  });

  it("should handle errors gracefully and return disabled", async () => {
    vi.mocked(getDoc).mockRejectedValueOnce(new Error("Firestore unavailable"));

    const status = await getTwoFactorStatus("user-1");

    expect(status.isEnabled).toBe(false);
  });
});

describe("generateBackupCodes", () => {
  it("should generate the default number of backup codes (10)", () => {
    const codes = generateBackupCodes();

    expect(codes).toHaveLength(10);
  });

  it("should generate the specified number of codes", () => {
    const codes = generateBackupCodes(5);

    expect(codes).toHaveLength(5);
  });

  it("should generate codes in the correct format (hex groups separated by dashes)", () => {
    const codes = generateBackupCodes(1);
    const code = codes[0];

    // Source generates 4 random bytes -> 8 hex chars -> split into groups of 4: XXXX-XXXX
    expect(code).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
  });

  it("should generate unique codes each time", () => {
    const codes = generateBackupCodes(10);

    // All codes should be unique
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(10);
  });

  it("should generate different codes on subsequent calls", () => {
    const codes1 = generateBackupCodes(5);
    const codes2 = generateBackupCodes(5);

    // The two sets should be different (extremely unlikely to collide)
    const allCodes = [...codes1, ...codes2];
    const uniqueCodes = new Set(allCodes);
    expect(uniqueCodes.size).toBe(10);
  });

  it("should return empty array when count is 0", () => {
    const codes = generateBackupCodes(0);
    expect(codes).toEqual([]);
  });
});

describe("verifyBackupCode", () => {
  it("should return false when user doc does not exist", async () => {
    const result = await verifyBackupCode("nonexistent", "ABCD-1234-EFGH");
    expect(result).toBe(false);
  });

  it("should return false when no backup codes exist", async () => {
    addMockDocs("user_accounts/user-1", [
      {
        id: "user-1",
        email: "user@example.com",
      },
    ]);

    const result = await verifyBackupCode("user-1", "ABCD-1234-EFGH");
    expect(result).toBe(false);
  });

  it("should return true for a valid backup code", async () => {
    addMockDocs("user_accounts/user-1", [
      {
        id: "user-1",
        email: "user@example.com",
        backupCodes: ["ABCD-1234-EFGH"],
      },
    ]);

    const result = await verifyBackupCode("user-1", "ABCD-1234-EFGH");
    expect(result).toBe(true);
  });

  it("should remove the used backup code from the user document", async () => {
    const codes = ["ABCD-1234-EFGH", "WXYZ-5678-IJKL"];
    addMockDocs("user_accounts/user-1", [
      {
        id: "user-1",
        email: "user@example.com",
        backupCodes: [...codes],
      },
    ]);

    await verifyBackupCode("user-1", "ABCD-1234-EFGH");

    expect(updateDoc).toHaveBeenCalledWith(
      "user_accounts/user-1",
      expect.objectContaining({
        backupCodes: ["WXYZ-5678-IJKL"],
      }),
    );
  });

  it("should return false for an invalid backup code", async () => {
    addMockDocs("user_accounts/user-1", [
      {
        id: "user-1",
        email: "user@example.com",
        backupCodes: ["ABCD-1234-EFGH"],
      },
    ]);

    const result = await verifyBackupCode("user-1", "INVALID-CODE");
    expect(result).toBe(false);
  });

  it("should normalize the code by removing dashes and uppercasing", async () => {
    addMockDocs("user_accounts/user-1", [
      {
        id: "user-1",
        email: "user@example.com",
        backupCodes: ["ABCD-1234-EFGH"],
      },
    ]);

    // Lowercase input with different dash format should still match
    const result = await verifyBackupCode("user-1", "abcd1234efgh");
    expect(result).toBe(true);
  });

  it("should handle errors gracefully and return false", async () => {
    vi.mocked(getDoc).mockRejectedValueOnce(new Error("Firestore error"));

    const result = await verifyBackupCode("user-1", "ABCD-1234-EFGH");
    expect(result).toBe(false);
  });

  it("should remove exactly the used code and keep others intact", async () => {
    const codes = ["CODE-0001", "CODE-0002", "CODE-0003"];
    addMockDocs("user_accounts/user-1", [
      {
        id: "user-1",
        email: "user@example.com",
        backupCodes: [...codes],
      },
    ]);

    await verifyBackupCode("user-1", "CODE-0002");

    expect(updateDoc).toHaveBeenCalledWith(
      "user_accounts/user-1",
      expect.objectContaining({
        backupCodes: ["CODE-0001", "CODE-0003"],
      }),
    );
  });
});
