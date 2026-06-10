import { useEffect, useRef } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/config/firebase";

export function useAuthPersistence() {
  const persistRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem("remember-me") === "true";
    persistRef.current = stored;

    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user && stored) {
        localStorage.setItem("last-user", user.uid);
      }
    });

    return unsubscribe;
  }, []);
}

export function useRememberMe() {
  const setRememberMe = (remember: boolean) => {
    localStorage.setItem("remember-me", String(remember));
  };

  const getRememberMe = () => localStorage.getItem("remember-me") === "true";

  return { setRememberMe, getRememberMe };
}
