import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  encrypt,
  decrypt,
  encryptSensitiveFields,
  decryptSensitiveFields,
  hashSensitiveData,
  generateEncryptionKey,
  storeEncryptionKey,
  getEncryptionKey,
  clearEncryptionKey,
  SENSITIVE_FIELDS,
} from "./encryption";

describe("encryption utils", () => {
  const testPassphrase = "test-passphrase-123!@#";
  const weakPassphrase = "abc";

  describe("encrypt and decrypt round-trip", () => {
    it("should encrypt and decrypt a simple string", async () => {
      const original = "Hello, World!";
      const encrypted = await encrypt(original, testPassphrase);
      expect(encrypted).not.toBe(original);
      expect(encrypted).not.toBe("");

      const decrypted = await decrypt(encrypted, testPassphrase);
      expect(decrypted).toBe(original);
    });

    it("should encrypt and decrypt an email address", async () => {
      const original = "user@example.com";
      const encrypted = await encrypt(original, testPassphrase);
      const decrypted = await decrypt(encrypted, testPassphrase);
      expect(decrypted).toBe(original);
    });

    it("should encrypt and decrypt a TIN number", async () => {
      const original = "123-456-789-000";
      const encrypted = await encrypt(original, testPassphrase);
      const decrypted = await decrypt(encrypted, testPassphrase);
      expect(decrypted).toBe(original);
    });

    it("should encrypt and decrypt an SSS number", async () => {
      const original = "12-3456789-0";
      const encrypted = await encrypt(original, testPassphrase);
      const decrypted = await decrypt(encrypted, testPassphrase);
      expect(decrypted).toBe(original);
    });

    it("should encrypt and decrypt a bank account number", async () => {
      const original = "1234567890";
      const encrypted = await encrypt(original, testPassphrase);
      const decrypted = await decrypt(encrypted, testPassphrase);
      expect(decrypted).toBe(original);
    });

    it("should handle empty string", async () => {
      expect(await encrypt("", testPassphrase)).toBe("");
      expect(await decrypt("", testPassphrase)).toBe("");
    });

    it("should produce different ciphertexts for same plaintext", async () => {
      const original = "Same data";
      const enc1 = await encrypt(original, testPassphrase);
      const enc2 = await encrypt(original, testPassphrase);
      expect(enc1).not.toBe(enc2); // random salt/IV ensures uniqueness
    });

    it("should fail to decrypt with wrong passphrase", async () => {
      const original = "Secret data";
      const encrypted = await encrypt(original, testPassphrase);
      const decrypted = await decrypt(encrypted, "wrong-passphrase");
      // Should return empty string on failure
      expect(decrypted).toBe("");
    });

    it("should handle data with special characters", async () => {
      const original =
        "Special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?`~你好日本語";
      const encrypted = await encrypt(original, testPassphrase);
      const decrypted = await decrypt(encrypted, testPassphrase);
      expect(decrypted).toBe(original);
    });

    it("should handle very long strings", async () => {
      const original = "A".repeat(10000);
      const encrypted = await encrypt(original, testPassphrase);
      const decrypted = await decrypt(encrypted, testPassphrase);
      expect(decrypted).toBe(original);
    });

    it("should work with weak passphrase", async () => {
      const original = "Test with weak key";
      const encrypted = await encrypt(original, weakPassphrase);
      const decrypted = await decrypt(encrypted, weakPassphrase);
      expect(decrypted).toBe(original);
    });

    it("should return valid base64 from encrypt", async () => {
      const encrypted = await encrypt("test", testPassphrase);
      expect(() => atob(encrypted)).not.toThrow();
    });

    it("should handle single character input", async () => {
      const original = "X";
      const encrypted = await encrypt(original, testPassphrase);
      const decrypted = await decrypt(encrypted, testPassphrase);
      expect(decrypted).toBe(original);
    });

    it("should handle newline and tab characters", async () => {
      const original = "line1\nline2\ttab";
      const encrypted = await encrypt(original, testPassphrase);
      const decrypted = await decrypt(encrypted, testPassphrase);
      expect(decrypted).toBe(original);
    });
  });

  describe("encryptSensitiveFields / decryptSensitiveFields", () => {
    it("should encrypt specified fields of an object", async () => {
      const employee = {
        name: "Juan Dela Cruz",
        sss: "12-3456789-0",
        tin: "123-456-789-000",
        philhealth: "12-345678901-2",
        hdmf: "1234-5678-9012",
        position: "Software Engineer",
      };

      const encrypted = await encryptSensitiveFields(
        employee,
        ["sss", "tin", "philhealth", "hdmf"],
        testPassphrase,
      );

      expect(encrypted.name).toBe("Juan Dela Cruz"); // unchanged
      expect(encrypted.position).toBe("Software Engineer"); // unchanged
      expect(encrypted.sss).not.toBe(employee.sss);
      expect(encrypted.tin).not.toBe(employee.tin);
      expect(encrypted.philhealth).not.toBe(employee.philhealth);
      expect(encrypted.hdmf).not.toBe(employee.hdmf);

      // Verify they can be decrypted back
      expect(typeof encrypted.sss).toBe("string");
      expect(typeof encrypted.tin).toBe("string");
    });

    it("should decrypt specified fields back to original", async () => {
      const employee = {
        name: "Juan Dela Cruz",
        sss: "12-3456789-0",
        tin: "123-456-789-000",
      };

      const encrypted = await encryptSensitiveFields(
        employee,
        ["sss", "tin"],
        testPassphrase,
      );
      const decrypted = await decryptSensitiveFields(
        encrypted,
        ["sss", "tin"],
        testPassphrase,
      );

      expect(decrypted.name).toBe("Juan Dela Cruz");
      expect(decrypted.sss).toBe("12-3456789-0");
      expect(decrypted.tin).toBe("123-456-789-000");
    });

    it("should handle empty fields list", async () => {
      const obj = { a: 1, b: "hello" };
      const result = await encryptSensitiveFields(obj, [], testPassphrase);
      expect(result).toEqual(obj);
    });

    it("should skip non-string values", async () => {
      const obj = { name: "Test", age: 30, active: true };
      const result = await encryptSensitiveFields(
        obj,
        ["name", "age", "active"],
        testPassphrase,
      );
      expect(result.name).not.toBe("Test");
      expect(result.age).toBe(30); // number, not encrypted
      expect(result.active).toBe(true); // boolean, not encrypted
    });

    it("should handle decryption failure gracefully", async () => {
      const obj = {
        name: "Test",
        sss: await encrypt("12-3456789-0", testPassphrase),
      };
      // Try to decrypt with wrong passphrase
      const result = await decryptSensitiveFields(
        obj,
        ["sss"],
        "wrong-passphrase",
      );
      expect(result.sss).toBe(""); // returns empty on failure
    });

    it("should not modify original object", async () => {
      const obj = { sss: "12-3456789-0", name: "Test" };
      const originalSss = obj.sss;
      await encryptSensitiveFields(obj, ["sss"], testPassphrase);
      expect(obj.sss).toBe(originalSss);
    });

    it("should handle empty string field values", async () => {
      const obj = { sss: "", name: "Test" };
      const result = await encryptSensitiveFields(
        obj,
        ["sss"],
        testPassphrase,
      );
      // Empty string is skipped (falsy check), so remains unchanged
      expect(result.sss).toBe("");
    });

    it("should handle decryptSensitiveFields with non-string field values", async () => {
      const obj = { name: "Test", age: 30 };
      const result = await decryptSensitiveFields(
        obj,
        ["name", "age"],
        testPassphrase,
      );
      // name is a string so it attempts decryption, which fails (not encrypted) → returns ""
      expect(result.name).toBe("");
      expect(result.age).toBe(30);
    });

    it("should handle all SENSITIVE_FIELDS for employeeProfile", async () => {
      const employee = {
        sss: "12-3456789-0",
        tin: "123-456-789-000",
        philhealth: "12-345678901-2",
        hdmf: "1234-5678-9012",
        bankAccount: "1234567890",
      };

      const encrypted = await encryptSensitiveFields(
        employee,
        SENSITIVE_FIELDS.employeeProfile,
        testPassphrase,
      );
      const decrypted = await decryptSensitiveFields(
        encrypted,
        SENSITIVE_FIELDS.employeeProfile,
        testPassphrase,
      );

      expect(decrypted).toEqual(employee);
    });
  });

  describe("hashSensitiveData", () => {
    it("should produce consistent hex hash for same input", async () => {
      const hash1 = await hashSensitiveData("test-data");
      const hash2 = await hashSensitiveData("test-data");
      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different inputs", async () => {
      const hash1 = await hashSensitiveData("data1");
      const hash2 = await hashSensitiveData("data2");
      expect(hash1).not.toBe(hash2);
    });

    it("should produce a SHA-256 hash (64 hex chars)", async () => {
      const hash = await hashSensitiveData("anything");
      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    });

    it("should handle empty string", async () => {
      const hash = await hashSensitiveData("");
      expect(hash).toHaveLength(64);
    });

    it("should handle unicode characters", async () => {
      const hash = await hashSensitiveData("ññoöü José 😀");
      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    });

    it("should handle very long input", async () => {
      const hash = await hashSensitiveData("x".repeat(100000));
      expect(hash).toHaveLength(64);
    });
  });

  describe("generateEncryptionKey", () => {
    it("should generate a 64-character hex key", () => {
      const key = generateEncryptionKey();
      expect(key).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(key)).toBe(true);
    });

    it("should generate different keys each time", () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe("storeEncryptionKey / getEncryptionKey / clearEncryptionKey", () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    it("should store and retrieve an encryption key", () => {
      const key = generateEncryptionKey();
      storeEncryptionKey(key);
      expect(getEncryptionKey()).toBe(key);
    });

    it("should return null when no key is stored", () => {
      expect(getEncryptionKey()).toBeNull();
    });

    it("should clear the stored encryption key", () => {
      const key = generateEncryptionKey();
      storeEncryptionKey(key);
      expect(getEncryptionKey()).toBe(key);

      clearEncryptionKey();
      expect(getEncryptionKey()).toBeNull();
    });

    it("should overwrite previously stored key", () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      storeEncryptionKey(key1);
      storeEncryptionKey(key2);
      expect(getEncryptionKey()).toBe(key2);
    });

    it("should handle storing empty string key", () => {
      storeEncryptionKey("");
      expect(getEncryptionKey()).toBe("");
    });

    it("should handle storing and clearing multiple times", () => {
      for (let i = 0; i < 5; i++) {
        const key = generateEncryptionKey();
        storeEncryptionKey(key);
        expect(getEncryptionKey()).toBe(key);
        clearEncryptionKey();
        expect(getEncryptionKey()).toBeNull();
      }
    });
  });

  describe("SENSITIVE_FIELDS", () => {
    it("should define employee profile sensitive fields", () => {
      expect(SENSITIVE_FIELDS.employeeProfile).toContain("sss");
      expect(SENSITIVE_FIELDS.employeeProfile).toContain("tin");
      expect(SENSITIVE_FIELDS.employeeProfile).toContain("philhealth");
      expect(SENSITIVE_FIELDS.employeeProfile).toContain("hdmf");
      expect(SENSITIVE_FIELDS.employeeProfile).toContain("bankAccount");
    });

    it("should define employee contact sensitive fields", () => {
      expect(SENSITIVE_FIELDS.employeeContact).toContain("value");
    });

    it("should have exactly two entity types", () => {
      const keys = Object.keys(SENSITIVE_FIELDS);
      expect(keys).toHaveLength(2);
      expect(keys).toContain("employeeProfile");
      expect(keys).toContain("employeeContact");
    });
  });
});
