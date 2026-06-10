import { useState } from "react";
import { X } from "lucide-react";

interface FilterPersistenceBarProps {
  filters: Record<string, string>;
  onRestore: (filters: Record<string, string>) => void;
  onDismiss: () => void;
}

export function FilterPersistenceBar({
  filters,
  onRestore,
  onDismiss,
}: FilterPersistenceBarProps) {
  const [dismissed, setDismissed] = useState(false);
  const hasFilters = Object.values(filters).some((v) => v !== "");

  if (dismissed || !hasFilters) return null;

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
      <span className="text-blue-700">
        Filters are active from your last session.
      </span>
      <button
        type="button"
        onClick={() => onRestore(filters)}
        className="text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        Restore
      </button>
      <button
        type="button"
        onClick={() => {
          setDismissed(true);
          onDismiss();
        }}
        className="ml-auto p-0.5 rounded hover:bg-blue-100"
      >
        <X className="w-4 h-4 text-blue-400" />
      </button>
    </div>
  );
}
