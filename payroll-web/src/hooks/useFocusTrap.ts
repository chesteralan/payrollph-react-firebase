import { useCallback, useState } from "react";

export function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!active || !containerRef.current) return;
      const focusable = containerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [active, containerRef],
  );

  const activate = useCallback(() => {
    setActive(true);
    document.addEventListener("keydown", handleKeyDown);
    containerRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )?.focus();
  }, [handleKeyDown, containerRef]);

  const deactivate = useCallback(() => {
    setActive(false);
    document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { activate, deactivate, active };
}
