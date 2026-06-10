import { clsx } from "clsx";
import { X } from "lucide-react";

export interface FilterChip {
  id: string;
  label: string;
  category?: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label?: string;
}

export function FilterChips({
  chips,
  selected,
  onChange,
  label,
}: FilterChipsProps) {
  const categories = [...new Set(chips.filter((c) => c.category).map((c) => c.category!))];
  const grouped = categories.length > 0;

  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    );
  };

  const clear = () => onChange([]);

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">{label}</span>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="text-xs text-primary-600 hover:text-primary-800"
            >
              Clear all
            </button>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {grouped
          ? categories.map((cat) => (
              <div key={cat} className="flex items-center gap-1 flex-wrap">
                {chips
                  .filter((c) => c.category === cat)
                  .map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => toggle(chip.id)}
                      className={clsx(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                        selected.includes(chip.id)
                          ? "bg-primary-100 border-primary-300 text-primary-700"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100",
                      )}
                    >
                      {chip.label}
                      {selected.includes(chip.id) && (
                        <X className="w-3 h-3" />
                      )}
                    </button>
                  ))}
              </div>
            ))
          : chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => toggle(chip.id)}
                className={clsx(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                  selected.includes(chip.id)
                    ? "bg-primary-100 border-primary-300 text-primary-700"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100",
                )}
              >
                {chip.label}
                {selected.includes(chip.id) && (
                  <X className="w-3 h-3" />
                )}
              </button>
            ))}
      </div>
    </div>
  );
}
