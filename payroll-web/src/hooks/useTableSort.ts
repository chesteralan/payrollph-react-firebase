import { useState, useMemo } from "react";

export type SortDirection = "asc" | "desc" | null;

export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

export function useTableSort<T extends Record<string, unknown>>(
  items: T[],
  defaultSort?: keyof T,
) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(
    defaultSort ? { key: defaultSort, direction: "asc" } : null,
  );
  const [filterText, setFilterText] = useState("");

  const sortedAndFiltered = useMemo(() => {
    let result = [...items];

    if (filterText) {
      const lower = filterText.toLowerCase();
      result = result.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(lower),
        ),
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();

        if (sortConfig.direction === "asc") {
          return aStr.localeCompare(bStr);
        }
        return bStr.localeCompare(aStr);
      });
    }

    return result;
  }, [items, sortConfig, filterText]);

  const handleSort = (key: keyof T) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        if (prev.direction === "desc") return null;
      }
      return { key, direction: "asc" };
    });
  };

  return {
    items: sortedAndFiltered,
    sortConfig,
    filterText,
    setFilterText,
    handleSort,
  };
}
