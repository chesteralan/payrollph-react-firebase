// Firebase Security Rules Tests
// Run with: npx firebase emulators:exec --only firestore "npx vitest run src/test/security.rules.test.ts"
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { resolve } from "path";

let testEnv: RulesTestEnvironment;

const PROJECT_ID = "payroll-test";

beforeAll(async () => {
  // Load the firestore.rules file
  const rules = readFileSync(
    resolve(__dirname, "../../../firestore.rules"),
    "utf8",
  );

  // Initialize test environment with the rules
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
    },
  });
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

describe("Firestore Security Rules", () => {
  describe("Users Collection", () => {
    it("should allow authenticated user to read own user doc", async () => {
      const user = testEnv.authenticatedContext("user1", {
        email: "test@example.com",
      });

      // Create a user doc first (bypassing rules as admin)
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("user_accounts").doc("user1").set({
          email: "test@example.com",
          displayName: "Test User",
          isActive: true,
        });
      });

      // User should be able to read their own doc
      const doc = user.firestore().collection("user_accounts").doc("user1");
      await expect(doc.get()).resolves.toBeDefined();
    });

    it("should not allow user to read other user docs", async () => {
      const user = testEnv.authenticatedContext("user1", {
        email: "test@example.com",
      });

      // Create another user doc
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("user_accounts").doc("user2").set({
          email: "other@example.com",
          displayName: "Other User",
          isActive: true,
        });
      });

      // User should NOT be able to read other user's doc
      const doc = user.firestore().collection("user_accounts").doc("user2");
      await expect(doc.get()).rejects.toThrow();
    });

    it("should not allow unauthenticated access", async () => {
      const unauthed = testEnv.unauthenticatedContext();

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("user_accounts").doc("user1").set({
          email: "test@example.com",
        });
      });

      const doc = unauthed.firestore().collection("user_accounts").doc("user1");
      await expect(doc.get()).rejects.toThrow();
    });
  });

  describe("Companies Collection", () => {
    it("should allow user with company access to read company", async () => {
      const user = testEnv.authenticatedContext("user1", {
        email: "test@example.com",
        companyIds: ["company1"],
      });

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("companies").doc("company1").set({
          name: "Test Company",
          isActive: true,
        });
      });

      const doc = user.firestore().collection("companies").doc("company1");
      await expect(doc.get()).resolves.toBeDefined();
    });

    it("should not allow user without company access to read", async () => {
      const user = testEnv.authenticatedContext("user1", {
        email: "test@example.com",
        companyIds: ["company2"],
      });

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("companies").doc("company1").set({
          name: "Test Company",
          isActive: true,
        });
      });

      const doc = user.firestore().collection("companies").doc("company1");
      await expect(doc.get()).rejects.toThrow();
    });
  });

  describe("Employees Collection", () => {
    it("should allow read with proper permissions", async () => {
      const user = testEnv.authenticatedContext("user1", {
        email: "test@example.com",
        companyIds: ["company1"],
        restrictions: {
          employees: { employees: { view: true } },
        },
      });

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("employees").doc("emp1").set({
          nameId: "name1",
          companyId: "company1",
          employeeCode: "EMP001",
          isActive: true,
        });
      });

      const doc = user.firestore().collection("employees").doc("emp1");
      await expect(doc.get()).resolves.toBeDefined();
    });

    it("should not allow read without view permission", async () => {
      const user = testEnv.authenticatedContext("user1", {
        email: "test@example.com",
        companyIds: ["company1"],
        restrictions: {
          employees: { employees: { view: false } },
        },
      });

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("employees").doc("emp1").set({
          nameId: "name1",
          companyId: "company1",
          employeeCode: "EMP001",
        });
      });

      const doc = user.firestore().collection("employees").doc("emp1");
      await expect(doc.get()).rejects.toThrow();
    });
  });

  describe("Audit Logs Collection", () => {
    it("should allow creating audit logs for authenticated users", async () => {
      const user = testEnv.authenticatedContext("user1", {
        email: "test@example.com",
      });

      const doc = user.firestore().collection("system_audit").doc();
      await expect(
        doc.set({
          userId: "user1",
          userName: "Test User",
          action: "login",
          module: "auth",
          description: "User logged in",
          timestamp: new Date(),
        }),
      ).resolves.toBeUndefined();
    });

    it("should not allow updating audit logs", async () => {
      const user = testEnv.authenticatedContext("user1", {
        email: "test@example.com",
      });

      // First create a log as admin
      let logId: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection("system_audit").add({
          userId: "user1",
          action: "login",
          module: "auth",
          description: "Test",
          timestamp: new Date(),
        });
        logId = doc.id;
      });

      // Try to update
      const doc = user.firestore().collection("system_audit").doc(logId);
      await expect(doc.update({ description: "Updated" })).rejects.toThrow();
    });
  });
});
