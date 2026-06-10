import { clsx } from "clsx";
import { Clock, X, Trash2 } from "lucide-react";

interface RecentSearchesProps {
  searches: string[];
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  onClear: () => void;
  className?: string;
}

export function RecentSearches({
  searches,
  onSelect,
  onRemove,
  onClear,
  className,
}: RecentSearchesProps) {
  if (searches.length === 0) return null;

  return (
    <div className={clsx("space-y-1", className)}>
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium text-gray-400">Recent Searches</span>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>
      {searches.map((query) => (
        <div
          key={query}
          className="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
          onClick={() => onSelect(query)}
        >
          <Clock className="w-3 h-3 text-gray-300 shrink-0" />
          <span className="text-sm text-gray-600 flex-1 truncate">{query}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(query);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 transition-opacity"
          >
            <X className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      ))}
    </div>
  );
}
