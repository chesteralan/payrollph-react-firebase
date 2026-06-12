import { useMemo } from "react";

const RUNBOOKS = [
  { id: "payroll-processing", title: "Payroll Processing Issues", steps: ["Check payroll status", "Verify DTR data", "Review error logs", "Restart processing if stuck"] },
  { id: "auth-outage", title: "Authentication Outage", steps: ["Check Firebase Auth status", "Verify network connectivity", "Check CORS configuration", "Review auth logs"] },
  { id: "data-discrepancy", title: "Data Discrepancy", steps: ["Identify affected records", "Compare with backup", "Run data reconciliation", "Document findings"] },
  { id: "deployment-rollback", title: "Deployment Rollback", steps: ["Identify breaking change", "Revert to previous commit", "Re-run CI/CD pipeline", "Notify stakeholders"] },
];

export function useOperationalRunbook() {
  const runbooks = useMemo(() => RUNBOOKS, []);

  const getRunbook = (id: string) => runbooks.find((r) => r.id === id);

  return { runbooks, getRunbook };
}
