import { AlertCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { PayrollValidationError } from "../../types";

interface ValidationPanelProps {
  errors: PayrollValidationError[];
  onClose: () => void;
}

export function ValidationPanel({ errors }: ValidationPanelProps) {
  const hasErrors = errors.some((e) => e.severity === "error");

  return (
    <Card className={hasErrors ? "border-red-200" : "border-yellow-200"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasErrors ? (
            <>
              <AlertCircle className="w-5 h-5 text-red-500" />
              Validation Errors
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Validation Warnings
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {errors.map((err, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 p-2 rounded ${err.severity === "error" ? "bg-red-50" : "bg-yellow-50"}`}
            >
              {err.severity === "error" ? (
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
              )}
              <div>
                <span className="text-sm font-medium">
                  {err.employeeName ? `${err.employeeName}: ` : ""}
                  {err.message}
                </span>
                {err.nameId && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({err.nameId})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
