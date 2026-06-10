import { clsx } from "clsx";
import { Trash2 } from "lucide-react";
import { Button } from "../Button";

interface RetentionPolicyConfigProps {
  policies: { collection: string; retentionDays: number; enabled: boolean }[];
  onToggle: (collection: string) => void;
  onRunCleanup: (collection: string) => void;
  className?: string;
}

export function RetentionPolicyConfig({
  policies,
  onToggle,
  onRunCleanup,
  className,
}: RetentionPolicyConfigProps) {
  return (
    <div className={clsx("space-y-2", className)}>
      {policies.map((policy) => (
        <div key={policy.collection} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={policy.enabled}
                onChange={() => onToggle(policy.collection)}
                className="rounded border-gray-300 text-primary-600"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">{policy.collection}</span>
                <p className="text-xs text-gray-500">{policy.retentionDays} days retention</p>
              </div>
            </label>
          </div>
          <Button size="sm" variant="ghost" onClick={() => onRunCleanup(policy.collection)}>
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Clean up
          </Button>
        </div>
      ))}
    </div>
  );
}
