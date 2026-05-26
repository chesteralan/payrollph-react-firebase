import { describe, it, expect, beforeEach, vi } from "vitest";
import { createFirestoreMocks, addMockDocs, clearMockDocs, createAuthMocks, getMockDocs } from "../__mocks__/firebase";

// Mock firebase/firestore with setDoc support and getDocs returning snapshots with .empty
vi.mock("firebase/firestore", () => ({
  ...createFirestoreMocks(),
  setDoc: vi.fn(async () => {}),
  getDocs: vi.fn(async (collectionPath: string) => {
    const { getMockDocs: fetchDocs } = await import("../__mocks__/firebase");
    const docs = fetchDocs(collectionPath);
    return {
      docs: docs.map((d: Record<string, unknown>) => ({
        id: d.id,
        exists: () => true,
        data: () => d,
      })),
      size: docs.length,
      empty: docs.length === 0,
      forEach: (cb: (doc: unknown) => void) =>
        docs.forEach((d: Record<string, unknown>) =>
          cb({ id: d.id, exists: () => true, data: () => d }),
        ),
    };
  }),
}));

// Mock firebase/auth with createUserWithEmailAndPassword
vi.mock("firebase/auth", () => ({
  ...createAuthMocks(),
  createUserWithEmailAndPassword: vi.fn(async (_auth: unknown, _email: string, _password: string) => ({
    user: {
      uid: "mock-uid-12345",
      email: "admin@example.com",
    },
  })),
}));

import {
  setupAdminUser,
  checkSetupNeeded,
} from "./setup";
import { setDoc, getDocs } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("setupAdminUser", () => {
  const setupParams = {
    email: "admin@example.com",
    password: "securePassword123!",
    displayName: "Admin User",
    companyName: "Acme Corp",
  };

  it("should create a Firebase Auth user with the provided credentials", async () => {
    await setupAdminUser(setupParams);

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      "admin@example.com",
      "securePassword123!",
    );
  });

  it("should create a user_accounts document", async () => {
    await setupAdminUser(setupParams);

    expect(setDoc).toHaveBeenCalledWith(
      "user_accounts/mock-uid-12345",
      expect.objectContaining({
        email: "admin@example.com",
        username: "admin",
        displayName: "Admin User",
        isActive: true,
      }),
    );
  });

  it("should create a user_settings document", async () => {
    await setupAdminUser(setupParams);

    expect(setDoc).toHaveBeenCalledWith(
      "user_settings/mock-uid-12345_default",
      expect.objectContaining({
        userId: "mock-uid-12345",
        theme: "light",
        itemsPerPage: 25,
      }),
    );
  });

  it("should create a company document", async () => {
    await setupAdminUser(setupParams);

    expect(setDoc).toHaveBeenCalledWith(
      "companies/initial_company",
      expect.objectContaining({
        name: "Acme Corp",
        isActive: true,
      }),
    );
  });

  it("should create a user_companies association", async () => {
    await setupAdminUser(setupParams);

    expect(setDoc).toHaveBeenCalledWith(
      "user_companies/mock-uid-12345_initial",
      expect.objectContaining({
        userId: "mock-uid-12345",
        companyId: "initial_company",
        isPrimary: true,
      }),
    );
  });

  it("should create user_restrictions for all departments and sections", async () => {
    await setupAdminUser(setupParams);

    // Count the number of setDoc calls for user_restrictions
    const restrictionCalls = (setDoc as ReturnType<typeof vi.fn>).mock.calls.filter(
      (call: [string]) => typeof call[0] === "string" && call[0].startsWith("user_restrictions/"),
    );

    // There should be multiple restriction documents created
    expect(restrictionCalls.length).toBeGreaterThan(0);

    // Each restriction should have canView, canAdd, canEdit, canDelete set to true
    for (const [, data] of restrictionCalls) {
      expect(data.canView).toBe(true);
      expect(data.canAdd).toBe(true);
      expect(data.canEdit).toBe(true);
      expect(data.canDelete).toBe(true);
    }
  });

  it("should return the created auth user", async () => {
    const user = await setupAdminUser(setupParams);

    expect(user).toBeDefined();
    expect(user.uid).toBe("mock-uid-12345");
    expect(user.email).toBe("admin@example.com");
  });

  it("should handle auth creation failure", async () => {
    vi.mocked(createUserWithEmailAndPassword).mockRejectedValueOnce(
      new Error("auth/email-already-in-use"),
    );

    await expect(setupAdminUser(setupParams)).rejects.toThrow("auth/email-already-in-use");
  });
});

describe("checkSetupNeeded", () => {
  it("should return true when user_accounts collection is empty", async () => {
    const needed = await checkSetupNeeded();

    expect(needed).toBe(true);
  });

  it("should return false when user_accounts collection has documents", async () => {
    addMockDocs("user_accounts", [
      {
        id: "user-1",
        email: "admin@example.com",
        displayName: "Admin",
        isActive: true,
      },
    ]);

    const needed = await checkSetupNeeded();

    expect(needed).toBe(false);
  });

  it("should call getDocs on user_accounts collection", async () => {
    await checkSetupNeeded();

    expect(getDocs).toHaveBeenCalledWith(expect.stringContaining("user_accounts"));
  });

  it("should handle Firestore errors gracefully", async () => {
    vi.mocked(getDocs).mockRejectedValueOnce(new Error("Permission denied"));

    // The function does not catch errors, so it will throw
    await expect(checkSetupNeeded()).rejects.toThrow("Permission denied");
  });
});
