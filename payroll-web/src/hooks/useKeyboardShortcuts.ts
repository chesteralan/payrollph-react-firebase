import { useEffect, useRef } from "react";

interface Shortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      for (const shortcut of shortcutsRef.current) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlKey
          ? e.ctrlKey || e.metaKey
          : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shiftKey ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.altKey ? e.altKey : !e.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (shortcut.preventDefault !== false) e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

export function useGlobalShortcuts(navigate?: (path: string) => void) {
  useKeyboardShortcuts([
    {
      key: "d",
      ctrlKey: true,
      shiftKey: true,
      action: () => navigate?.("/dashboard"),
    },
    {
      key: "e",
      ctrlKey: true,
      shiftKey: true,
      action: () => navigate?.("/employees"),
    },
    {
      key: "p",
      ctrlKey: true,
      shiftKey: true,
      action: () => navigate?.("/payroll"),
    },
    {
      key: "n",
      ctrlKey: true,
      action: () => navigate?.("/payroll/new"),
    },
  ]);
}
