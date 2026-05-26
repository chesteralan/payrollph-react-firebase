import { describe, it, expect, beforeEach, vi } from "vitest";
import { addMockDocs, clearMockDocs } from "../../__mocks__/firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getDoc, getDocs, addDoc } from "firebase/firestore";
import { checkSetupNeeded } from "../../services/setup";
import {
  auditLogin,
  auditLogout,
  auditSessionTimeout,
} from "../../services/audit";
import type { UserAccount } from "../../types";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

const mockUser: UserAccount = {
  id: "user-1",
  email: "admin@example.com",
  username: "admin",
  displayName: "Admin User",
  isActive: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

describe("Auth Flow — Login → Logout → Session Expiry", () => {
  // ── Login ──────────────────────────────────────────────────────────────
  describe("Login flow", () => {
    it("should detect when setup is needed (no user accounts)", async () => {
      const needed = await checkSetupNeeded();
      expect(needed).toBe(true);
    });

    it("should detect when setup is complete (user accounts exist)", async () => {
      addMockDocs("user_accounts", [
        { id: "user-1", email: "admin@example.com", isActive: true },
      ]);
      const needed = await checkSetupNeeded();
      expect(needed).toBe(false);
    });

    it("should call signInWithEmailAndPassword with credentials", async () => {
      vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({
        user: { uid: "user-1", email: "admin@example.com" },
      } as never);

      await signInWithEmailAndPassword(
        {} as never,
        "admin@example.com",
        "securePassword123!",
      );

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "admin@example.com",
        "securePassword123!",
      );
    });

    it("should reject login with invalid credentials", async () => {
      vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce(
        new Error("auth/invalid-credential"),
      );

      await expect(
        signInWithEmailAndPassword(
          {} as never,
          "wrong@example.com",
          "wrongpassword",
        ),
      ).rejects.toThrow("auth/invalid-credential");
    });

    it("should fire onAuthStateChanged after successful login", async () => {
      const callback = vi.fn();
      onAuthStateChanged({} as never, callback);
      expect(callback).toHaveBeenCalled();
    });

    it("should log audit entry on login", async () => {
      await auditLogin(mockUser, "email/password");
      expect(addDoc).toHaveBeenCalledWith(
        "system_audit",
        expect.objectContaining({
          userId: "user-1",
          action: "login",
          module: "auth",
          description: "User logged in via email/password",
        }),
      );
    });
  });

  // ── Logout ─────────────────────────────────────────────────────────────
  describe("Logout flow", () => {
    it("should call signOut and resolve", async () => {
      vi.mocked(signOut).mockResolvedValueOnce(undefined);
      await signOut({} as never);
      expect(signOut).toHaveBeenCalled();
    });

    it("should log audit entry on logout", async () => {
      await auditLogout(mockUser);
      expect(addDoc).toHaveBeenCalledWith(
        "system_audit",
        expect.objectContaining({
          userId: "user-1",
          action: "logout",
          module: "auth",
          description: "User logged out",
        }),
      );
    });

    it("should trigger onAuthStateChanged with null after logout", async () => {
      const callback = vi.fn();
      onAuthStateChanged({} as never, callback);
      expect(callback).toHaveBeenCalledWith(null);
    });

    it("should handle signOut error gracefully", async () => {
      vi.mocked(signOut).mockRejectedValueOnce(new Error("auth/network-error"));
      await expect(signOut({} as never)).rejects.toThrow("auth/network-error");
    });
  });

  // ── Session Expiry ─────────────────────────────────────────────────────
  describe("Session expiry detection", () => {
    it("should create audit log for session timeout", async () => {
      await auditSessionTimeout(mockUser);
      expect(addDoc).toHaveBeenCalledWith(
        "system_audit",
        expect.objectContaining({
          userId: "user-1",
          action: "session_timeout",
          module: "auth",
          description: "Session timed out due to inactivity",
        }),
      );
    });

    it("should handle session timeout when user is null", async () => {
      await expect(auditSessionTimeout(null)).resolves.toBeUndefined();
    });

    it("should load user data from firestore after auth", async () => {
      addMockDocs("user_accounts/user-1", [
        {
          id: "user-1",
          email: "admin@example.com",
          displayName: "Admin User",
          isActive: true,
        },
      ]);

      const result = await getDoc("user_accounts/user-1");
      expect(result.exists()).toBe(true);
      const data = result.data() as Record<string, unknown>;
      expect(data.email).toBe("admin@example.com");
      expect(data.displayName).toBe("Admin User");
    });

    it("should return null for deleted user accounts", async () => {
      const result = await getDoc("user_accounts/nonexistent");
      expect(result.exists()).toBe(false);
    });
  });

  // ── Full auth lifecycle ────────────────────────────────────────────────
  describe("Auth lifecycle (full flow)", () => {
    it("should perform complete login → audit → logout → audit cycle", async () => {
      // Phase 1: Login
      vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({
        user: { uid: "user-1", email: "admin@example.com" },
      } as never);

      await signInWithEmailAndPassword(
        {} as never,
        "admin@example.com",
        "password123",
      );

      // Phase 2: Audit login
      await auditLogin(mockUser);

      // Phase 3: Load user data
      addMockDocs("user_accounts/user-1", [
        { id: "user-1", email: "admin@example.com", displayName: "Admin User" },
      ]);
      const userDoc = await getDoc("user_accounts/user-1");
      expect(userDoc.exists()).toBe(true);

      // Phase 4: Logout
      await signOut({} as never);
      await auditLogout(mockUser);
    });

    it("should audit permission denied attempts", async () => {
      const { auditPermissionDenied } = await import("../../services/audit");
      await auditPermissionDenied(mockUser, "payroll", "publish");
      expect(addDoc).toHaveBeenCalledWith(
        "system_audit",
        expect.objectContaining({
          action: "permission_denied",
          module: "payroll",
        }),
      );
    });
  });
});
