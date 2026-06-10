import { clsx } from "clsx";
import { Database, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "../Button";

interface MigrationStep {
  id: string;
  label: string;
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
}

interface DataMigrationToolProps {
  steps: MigrationStep[];
  onRun: (stepId: string) => Promise<void>;
  onRunAll: () => Promise<void>;
  className?: string;
}

export function DataMigrationTool({
  steps,
  onRun,
  onRunAll,
  className,
}: DataMigrationToolProps) {
  const allDone = steps.every((s) => s.status === "completed");

  return (
    <div className={clsx("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Database Migrations</h3>
        <Button size="sm" onClick={onRunAll} disabled={allDone}>
          Run All Pending
        </Button>
      </div>
      {steps.map((step) => (
        <div
          key={step.id}
          className={clsx(
            "flex items-center justify-between p-3 rounded-lg border",
            step.status === "completed" && "bg-green-50 border-green-200",
            step.status === "failed" && "bg-red-50 border-red-200",
            step.status === "running" && "bg-blue-50 border-blue-200",
            step.status === "pending" && "bg-white border-gray-200",
          )}
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">{step.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {step.status === "pending" && (
              <Button size="sm" variant="secondary" onClick={() => onRun(step.id)}>
                Run
              </Button>
            )}
            {step.status === "running" && (
              <span className="text-xs text-blue-600 animate-pulse">Running...</span>
            )}
            {step.status === "completed" && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="w-3.5 h-3.5" /> Done
              </span>
            )}
            {step.status === "failed" && (
              <span className="inline-flex items-center gap-1 text-xs text-red-600" title={step.error}>
                <AlertTriangle className="w-3.5 h-3.5" /> Failed
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
