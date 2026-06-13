import { useCallback, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

export function useColorScheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("color-scheme") as ThemeMode | null;
    return stored || "system";
  });

  const setColorScheme = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem("color-scheme", newMode);
    const root = document.documentElement;
    if (newMode === "dark") {
      root.classList.add("dark");
    } else if (newMode === "light") {
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    }
  }, []);

  return { mode, setColorScheme };
}
