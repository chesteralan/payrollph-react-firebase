import { useState, useMemo } from "react";

export type SortDirection = "asc" | "desc" | null;

export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

/**
 * Hook providing client-side sorting and filtering for tabular data.
 * Supports multi-directional sort toggling (asc → desc → none) and
 * a global text filter that searches across all object values.
 *
 * @typeParam T - The type of objects in the array (must be a plain object)
 * @param items - The array of data items to sort and filter
 * @param defaultSort - Optional key to sort by on first render (ascending)
 * @returns An object containing:
 *  - `items`: The sorted and filtered array (memoized)
 *  - `sortConfig`: Current sort configuration `{ key, direction }` or `null`
 *  - `filterText`: Current filter text
 *  - `setFilterText(filter)`: Update the global filter
 *  - `handleSort(key)`: Toggle sort on a column (asc → desc → none)
 *
 * @example
 * ```tsx
 * const { items, sortConfig, handleSort, filterText, setFilterText } =
 *   useTableSort(employees, 'name');
 *
 * return (
 *   <div>
 *     <input value={filterText} onChange={e => setFilterText(e.target.value)} />
 *     <table>
 *       <thead>
 *         <th onClick={() => handleSort('name')}>Name {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}</th>
 *       </thead>
 *       {items.map(item => <tr>...</tr>)}
 *     </table>
 *   </div>
 * );
 * ```
 */
export function useTableSort<T extends object>(
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
