import { clsx } from "clsx";
import { Check, Minus, X } from "lucide-react";

interface A11yAuditItem {
  id: string;
  rule: string;
  status: "pass" | "fail" | "na";
  element?: string;
  message: string;
}

interface A11yAuditReportProps {
  items: A11yAuditItem[];
  className?: string;
}

export function A11yAuditReport({ items, className }: A11yAuditReportProps) {
  const passed = items.filter((i) => i.status === "pass").length;
  const failed = items.filter((i) => i.status === "fail").length;

  return (
    <div className={clsx("space-y-3", className)}>
      <div className="flex items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1 text-green-600">
          <Check className="w-4 h-4" /> {passed} passed
        </span>
        <span className="inline-flex items-center gap-1 text-red-600">
          <X className="w-4 h-4" /> {failed} failed
        </span>
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className={clsx(
              "flex items-start gap-2 p-2 rounded text-sm",
              item.status === "pass" && "bg-green-50",
              item.status === "fail" && "bg-red-50",
              item.status === "na" && "bg-gray-50",
            )}
          >
            {item.status === "pass" && <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />}
            {item.status === "fail" && <X className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
            {item.status === "na" && <Minus className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />}
            <div>
              <span className="font-medium text-gray-900">{item.rule}</span>
              {item.element && (
                <code className="ml-1 px-1 py-0.5 bg-white border rounded text-[10px] text-gray-500">
                  {item.element}
                </code>
              )}
              <p className="text-xs text-gray-500 mt-0.5">{item.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
