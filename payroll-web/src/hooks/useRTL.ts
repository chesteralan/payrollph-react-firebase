import { useState, useCallback } from "react";

type Dir = "ltr" | "rtl";

export function useRTL() {
  const [dir, setDir] = useState<Dir>("ltr");

  const toggleRTL = useCallback(() => {
    setDir((prev) => {
      const next = prev === "ltr" ? "rtl" : "ltr";
      document.documentElement.dir = next;
      return next;
    });
  }, []);

  const setDirection = useCallback((direction: Dir) => {
    setDir(direction);
    document.documentElement.dir = direction;
  }, []);

  return { dir, toggleRTL, setDirection, isRTL: dir === "rtl" };
}
