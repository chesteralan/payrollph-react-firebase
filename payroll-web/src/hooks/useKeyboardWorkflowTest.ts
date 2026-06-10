import { useState, useCallback } from "react";

export function useKeyboardWorkflowTest() {
  const [results, setResults] = useState<{ workflow: string; passed: boolean }[]>([]);

  const testWorkflow = useCallback(async (name: string, steps: () => Promise<boolean>) => {
    try {
      const passed = await steps();
      setResults((prev) => [...prev, { workflow: name, passed }]);
      return passed;
    } catch {
      setResults((prev) => [...prev, { workflow: name, passed: false }]);
      return false;
    }
  }, []);

  const testTabNavigation = useCallback(async (container: HTMLElement): Promise<boolean> => {
    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    for (let i = 0; i < focusable.length; i++) {
      focusable[i]?.focus();
      if (document.activeElement !== focusable[i]) return false;
    }
    return true;
  }, []);

  return { results, testWorkflow, testTabNavigation };
}
