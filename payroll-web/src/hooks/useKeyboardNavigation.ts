import { useState, useRef, useCallback, useEffect } from "react";

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
