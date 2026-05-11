// -nocheck
// Data encryption utilities for sensitive fields using Web Crypto API

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 12 bytes for AES-GCM

// Derive a key from a passphrase using PBKDF2
const deriveKey = async (
  passphrase: string,
  salt: Uint8Array,
): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  );
};

// Generate a random IV
const generateIV = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
};

// Generate a random salt
const generateSalt = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(16));
};

// Encrypt data
export const encrypt = async (
  data: string,
  passphrase: string,
): Promise<string> => {
  if (!data) return "";

  const salt = generateSalt();
  const iv = generateIV();
  const key = await deriveKey(passphrase, salt);
  const encoder = new TextEncoder();

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(data),
  );

  // Combine salt + iv + encrypted data
  const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encrypted), salt.length + iv.length);

  return btoa(String.fromCharCode(...result));
};

// Decrypt data
export const decrypt = async (
  encryptedData: string,
  passphrase: string,
): Promise<string> => {
  if (!encryptedData) return "";

  try {
    const data = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));

    const salt = data.slice(0, 16);
    const iv = data.slice(16, 16 + IV_LENGTH);
    const encrypted = data.slice(16 + IV_LENGTH);

    const key = await deriveKey(passphrase, salt);
    const decoder = new TextDecoder();

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encrypted,
    );

    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "";
  }
};

// Encrypt an object's sensitive fields
export const encryptSensitiveFields = async <T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
  passphrase: string,
): Promise<T> => {
  const encrypted = { ...obj };

  for (const field of fields) {
    const value = encrypted[field];
    if (typeof value === "string" && value) {
      encrypted[field] = (await encrypt(value, passphrase)) as T[keyof T];
    }
  }

  return encrypted;
};

// Decrypt an object's sensitive fields
export const decryptSensitiveFields = async <T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
  passphrase: string,
): Promise<T> => {
  const decrypted = { ...obj };

  for (const field of fields) {
    const value = decrypted[field];
    if (typeof value === "string" && value) {
      try {
        decrypted[field] = (await decrypt(value, passphrase)) as T[keyof T];
      } catch {
        // Keep original value if decryption fails
        console.warn(`Failed to decrypt field ${String(field)}`);
      }
    }
  }

  return decrypted;
};

// Simple hash function for non-reversible data (like IDs for indexing)
export const hashSensitiveData = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(data),
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

// Generate a secure encryption key (to be stored securely, e.g., in Firebase Remote Config or secure storage)
export const generateEncryptionKey = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
};

// Store encryption key in session storage (cleared on tab close)
export const storeEncryptionKey = (key: string): void => {
  sessionStorage.setItem("enc_key", key);
};

export const getEncryptionKey = (): string | null => {
  return sessionStorage.getItem("enc_key");
};

export const clearEncryptionKey = (): void => {
  sessionStorage.removeItem("enc_key");
};

// Fields that should be encrypted for each entity
export const SENSITIVE_FIELDS = {
  employeeProfile: ["sss", "tin", "philhealth", "hdmf", "bankAccount"] as const,
  employeeContact: ["value"] as const, // For phone/email if needed
};

export type SensitiveFieldType = keyof typeof SENSITIVE_FIELDS;
