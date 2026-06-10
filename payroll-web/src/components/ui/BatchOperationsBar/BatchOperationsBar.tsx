import { clsx } from "clsx";
import { Lock, CheckSquare } from "lucide-react";
import { Button } from "../Button";

interface BatchAction {
  id: string;
  label: string;
  icon: typeof Lock;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface BatchOperationsBarProps {
  selectedCount: number;
  actions: BatchAction[];
  onClear: () => void;
}

export function BatchOperationsBar({
  selectedCount,
  actions,
  onClear,
}: BatchOperationsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-0 z-20 flex items-center gap-3 px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg shadow-lg">
      <CheckSquare className="w-4 h-4 text-primary-600" />
      <span className="text-sm font-medium text-primary-700">
        {selectedCount} selected
      </span>
      <div className="w-px h-4 bg-primary-200" />
      <div className="flex items-center gap-1.5 flex-1">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              size="sm"
              variant={action.variant === "danger" ? "ghost" : "secondary"}
              onClick={action.onClick}
              className={clsx(
                action.variant === "danger" && "text-red-600 hover:bg-red-50",
              )}
            >
              <Icon className="w-3.5 h-3.5 mr-1" />
              {action.label}
            </Button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="text-xs text-gray-500 hover:text-gray-700"
      >
        Clear selection
      </button>
    </div>
  );
}
