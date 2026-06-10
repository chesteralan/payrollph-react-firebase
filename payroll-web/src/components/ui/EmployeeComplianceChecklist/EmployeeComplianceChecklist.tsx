import { clsx } from "clsx";
import { CheckCircle, Clock, AlertTriangle, RefreshCw } from "lucide-react";

interface ComplianceCheckItem {
  id: string;
  label: string;
  status: "compliant" | "expiring" | "missing";
  detail: string;
  dueDate?: string;
}

interface EmployeeComplianceChecklistProps {
  items: ComplianceCheckItem[];
  onRefresh: () => void;
  className?: string;
}

export function EmployeeComplianceChecklist({
  items,
  onRefresh,
  className,
}: EmployeeComplianceChecklistProps) {
  const missing = items.filter((i) => i.status === "missing").length;
  const expiring = items.filter((i) => i.status === "expiring").length;

  return (
    <div className={clsx("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {missing > 0 && (
            <span className="inline-flex items-center gap-1 text-red-600">
              <AlertTriangle className="w-4 h-4" /> {missing} missing
            </span>
          )}
          {expiring > 0 && (
            <span className="inline-flex items-center gap-1 text-yellow-600">
              <Clock className="w-4 h-4" /> {expiring} expiring
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="text-xs text-primary-600 hover:text-primary-800 inline-flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className={clsx(
              "flex items-center gap-2 p-2 rounded-lg text-sm",
              item.status === "compliant" && "bg-green-50",
              item.status === "expiring" && "bg-yellow-50",
              item.status === "missing" && "bg-red-50",
            )}
          >
            {item.status === "compliant" && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
            {item.status === "expiring" && <Clock className="w-4 h-4 text-yellow-500 shrink-0" />}
            {item.status === "missing" && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
            <div className="flex-1">
              <span className="font-medium text-gray-900">{item.label}</span>
              <p className="text-xs text-gray-500">{item.detail}</p>
            </div>
            {item.dueDate && (
              <span className="text-xs text-gray-400 whitespace-nowrap">{item.dueDate}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
