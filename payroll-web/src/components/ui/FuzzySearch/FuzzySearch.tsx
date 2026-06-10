import { useState } from "react";
import { clsx } from "clsx";
import { Search, X } from "lucide-react";

interface FuzzySearchProps {
  items: { id: string; label: string; keywords?: string[] }[];
  onSelect: (item: { id: string; label: string }) => void;
  placeholder?: string;
  maxResults?: number;
  className?: string;
}

function fuzzyMatch(text: string, query: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi >= q.length;
}

export function FuzzySearch({
  items,
  onSelect,
  placeholder = "Search...",
  maxResults = 10,
  className,
}: FuzzySearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = query
    ? items
        .filter(
          (item) =>
            fuzzyMatch(item.label, query) ||
            item.keywords?.some((k) => fuzzyMatch(k, query)),
        )
        .slice(0, maxResults)
    : [];

  return (
    <div className={clsx("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:border-primary-300 outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item);
                setQuery(item.label);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
