import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const PREFETCH_ROUTES: Record<string, string[]> = {
  "/": ["/employees", "/payroll"],
  "/employees": ["/employees/*", "/payroll"],
  "/payroll": ["/payroll/*", "/reports/payroll-summary"],
};

export function useCachePreloading() {
  const location = useLocation();

  useEffect(() => {
    const routesToPrefetch = PREFETCH_ROUTES[location.pathname] || [];
    routesToPrefetch.forEach((route) => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = route;
      document.head.appendChild(link);
    });
  }, [location.pathname]);
}
