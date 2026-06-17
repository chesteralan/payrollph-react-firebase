import { Check } from "lucide-react";

interface SelectionItem {
  id: string;
  label: string;
}

interface SelectionPanelProps {
  title: string;
  items: SelectionItem[];
  selected: string[];
  onToggle: (id: string) => void;
}

export function SelectionPanel({
  title,
  items,
  selected,
  onToggle,
}: SelectionPanelProps) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <span className="text-xs text-gray-500">
          {selected.length}/{items.length} selected
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onToggle(item.id)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm transition-colors ${selected.includes(item.id) ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
          >
            {selected.includes(item.id) ? (
              <Check className="w-3 h-3 shrink-0" />
            ) : (
              <div className="w-3 h-3 border rounded shrink-0" />
            )}
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
