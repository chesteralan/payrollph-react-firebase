import { useState, useCallback } from "react";

export function useWebAuthn() {
  const [supported] = useState(() => typeof PublicKeyCredential !== "undefined");
  const [registering, setRegistering] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  const isAvailable = async (): Promise<boolean> => {
    if (!PublicKeyCredential) return false;
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch {
      return false;
    }
  };

  const register = useCallback(async (userId: string, userName: string) => {
    if (!supported) throw new Error("WebAuthn not supported");
    setRegistering(true);
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "PayrollPH", id: window.location.hostname },
          user: { id: new TextEncoder().encode(userId), name: userName, displayName: userName },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
          authenticatorSelection: { userVerification: "preferred" },
          timeout: 60000,
        },
      });
      return credential;
    } finally {
      setRegistering(false);
    }
  }, [supported]);

  const authenticate = useCallback(async () => {
    if (!supported) throw new Error("WebAuthn not supported");
    setAuthenticating(true);
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          userVerification: "preferred",
          timeout: 60000,
        },
      });
      return credential;
    } finally {
      setAuthenticating(false);
    }
  }, [supported]);

  return { register, authenticate, supported, registering, authenticating, isAvailable };
}
