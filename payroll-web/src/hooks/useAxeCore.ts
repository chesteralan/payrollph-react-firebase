import { useEffect, useRef } from "react";

export function useAxeCore(enable = false) {
  const runRef = useRef(false);

  useEffect(() => {
    if (!enable || runRef.current) return;
    runRef.current = true;

    const runAudit = async () => {
      try {
        const ReactDOM = await import("react-dom/client");
        const axe = await import("@axe-core/react");
        axe.default(ReactDOM, 1000);
      } catch {
        console.warn("axe-core not available. Install with: npm install @axe-core/react");
      }
    };

    runAudit();
  }, [enable]);
}
