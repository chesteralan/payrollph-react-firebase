import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { Search, X } from "lucide-react";

interface DashboardSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function DashboardSearchBar({
  onSearch,
  placeholder = "Search employees, payrolls, reports...",
  className,
}: DashboardSearchBarProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      className={clsx(
        "relative flex items-center",
        focused && "ring-2 ring-primary-200 rounded-lg",
        className,
      )}
    >
      <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onSearch(e.target.value);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-primary-300 outline-none transition-colors"
        aria-label="Dashboard search"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            onSearch("");
            inputRef.current?.focus();
          }}
          className="absolute right-2 p-0.5 rounded hover:bg-gray-200"
        >
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      )}
      <kbd className="absolute right-2 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] text-gray-400 bg-gray-200 rounded gap-0.5">
        {navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}/</kbd>
    </div>
  );
}
