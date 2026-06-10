import { useCallback } from "react";

export function useAuditIntegrity() {
  const generateHash = useCallback(async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const hash = await crypto.subtle.digest("SHA-256", encoder.encode(data));
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }, []);

  const verifyIntegrity = useCallback(
    async (data: string, expectedHash: string): Promise<boolean> => {
      const actual = await generateHash(data);
      return actual === expectedHash;
    },
    [generateHash],
  );

  const hashAuditEntry = useCallback(
    async (entry: Record<string, unknown>): Promise<string> => {
      const serialized = JSON.stringify(entry, Object.keys(entry).sort());
      return generateHash(serialized + "payroll-audit-salt");
    },
    [generateHash],
  );

  return { generateHash, verifyIntegrity, hashAuditEntry };
}
