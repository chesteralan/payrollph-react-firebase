import { useEffect, useRef } from "react";

export function useScrollRestoration(key: string) {
  const positionRef = useRef(0);

  useEffect(() => {
    const saved = sessionStorage.getItem(`scroll-${key}`);
    if (saved) {
      window.scrollTo(0, parseInt(saved, 10));
    }
  }, [key]);

  useEffect(() => {
    const handler = () => {
      positionRef.current = window.scrollY;
      sessionStorage.setItem(`scroll-${key}`, String(window.scrollY));
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [key]);
}
