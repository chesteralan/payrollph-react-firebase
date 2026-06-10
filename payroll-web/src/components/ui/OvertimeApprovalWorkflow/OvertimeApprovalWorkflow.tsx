import { clsx } from "clsx";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface OvertimeRequest {
  id: string;
  employeeName: string;
  date: string;
  hours: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
}

interface OvertimeApprovalWorkflowProps {
  requests: OvertimeRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  className?: string;
}

export function OvertimeApprovalWorkflow({
  requests,
  onApprove,
  onReject,
  className,
}: OvertimeApprovalWorkflowProps) {
  const pending = requests.filter((r) => r.status === "pending");

  return (
    <div className={clsx("space-y-3", className)}>
      {pending.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {pending.length} pending approval{pending.length > 1 ? "s" : ""}
        </div>
      )}
      {requests.map((req) => (
        <div
          key={req.id}
          className={clsx(
            "p-3 rounded-lg border",
            req.status === "pending" && "border-yellow-200 bg-yellow-50/50",
            req.status === "approved" && "border-green-200 bg-green-50/50",
            req.status === "rejected" && "border-red-200 bg-red-50/50",
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{req.employeeName}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {req.date} · {req.hours}h overtime
              </p>
              <p className="text-xs text-gray-400 mt-1">{req.reason}</p>
            </div>
            <div className="flex items-center gap-1">
              {req.status === "pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => onApprove(req.id)}
                    className="p-1 rounded hover:bg-green-100 text-green-600"
                    title="Approve"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(req.id)}
                    className="p-1 rounded hover:bg-red-100 text-red-600"
                    title="Reject"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </>
              )}
              {req.status === "approved" && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="w-3.5 h-3.5" /> Approved
                </span>
              )}
              {req.status === "rejected" && (
                <span className="inline-flex items-center gap-1 text-xs text-red-600">
                  <XCircle className="w-3.5 h-3.5" /> Rejected
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
