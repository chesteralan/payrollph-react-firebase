import { useCallback, useState } from "react";

/**
 * Hook that traps keyboard focus within a container element (modals, dialogs, drawers).
 * Cycles Tab and Shift+Tab between the first and last focusable elements.
 *
 * @param containerRef - A React ref to the container element that should trap focus
 * @returns An object containing:
 *  - `activate()` — Activate the focus trap and focus the first focusable element
 *  - `deactivate()` — Deactivate the focus trap and remove the keydown listener
 *  - `active` — Boolean indicating whether the trap is currently active
 *
 * @example
 * ```tsx
 * const modalRef = useRef<HTMLDivElement>(null);
 * const { activate, deactivate, active } = useFocusTrap(modalRef);
 *
 * useEffect(() => { activate(); return () => deactivate(); }, []);
 * return <div ref={modalRef} role="dialog">...</div>;
 * ```
 */
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
