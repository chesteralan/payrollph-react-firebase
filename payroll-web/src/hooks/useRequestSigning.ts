import { useCallback, useRef } from "react";

export function useRequestSigning(secretKey: string) {
  const encoderRef = useRef(new TextEncoder());

  const signRequest = useCallback(
    async (payload: Record<string, unknown>): Promise<string> => {
      const data = encoderRef.current.encode(JSON.stringify(payload) + secretKey);
      const hash = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    },
    [secretKey],
  );

  const verifySignature = useCallback(
    async (payload: Record<string, unknown>, signature: string): Promise<boolean> => {
      const expected = await signRequest(payload);
      return expected === signature;
    },
    [signRequest],
  );

  return { signRequest, verifySignature };
}
