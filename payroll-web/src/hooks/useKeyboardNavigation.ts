import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Hook that enables keyboard navigation (Arrow Up/Down, Enter, Home, End, Escape)
 * through a list of items. Useful for dropdowns, autocompletes, and listboxes.
 *
 * @typeParam T - The type of items in the list
 * @param items - The array of selectable items
 * @param onSelect - Callback fired when the user presses Enter on a selected item.
 *   Receives the selected item and its index.
 * @returns An object containing:
 *  - `selectedIndex`: The index of the currently highlighted item (-1 for none)
 *  - `setSelectedIndex(index)`: Manually set the selected index
 *  - `handleKeyDown(e)`: Attach this to the container's `onKeyDown` handler
 *  - `containerRef`: A ref to attach to the container element
 *
 * @example
 * ```tsx
 * const { selectedIndex, handleKeyDown, containerRef } =
 *   useKeyboardNavigation(items, (item) => selectItem(item));
 *
 * return (
 *   <div ref={containerRef} onKeyDown={handleKeyDown}>
 *     {items.map((item, i) => (
 *       <div key={i} aria-selected={i === selectedIndex}>{item.name}</div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useKeyboardNavigation<T>(
  items: T[],
  onSelect: (item: T, index: number) => void,
) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        onSelect(items[selectedIndex], selectedIndex);
      } else if (e.key === "Home") {
        e.preventDefault();
        setSelectedIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setSelectedIndex(items.length - 1);
      } else if (e.key === "Escape") {
        setSelectedIndex(-1);
      }
    },
    [items, selectedIndex, onSelect],
  );

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setSelectedIndex(-1);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [items]);

  return { selectedIndex, setSelectedIndex, handleKeyDown, containerRef };
}
