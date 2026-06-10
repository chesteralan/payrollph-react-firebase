import { useCallback, useState } from "react";

interface AccessibleDndOptions {
  items: string[];
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export function useAccessibleDnd({ items, onReorder }: AccessibleDndOptions) {
  const [focusIndex, setFocusIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === "ArrowUp" && index > 0) {
        e.preventDefault();
        onReorder(index, index - 1);
        setFocusIndex(index - 1);
      } else if (e.key === "ArrowDown" && index < items.length - 1) {
        e.preventDefault();
        onReorder(index, index + 1);
        setFocusIndex(index + 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        onReorder(index, 0);
        setFocusIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        onReorder(index, items.length - 1);
        setFocusIndex(items.length - 1);
      }
    },
    [items.length, onReorder],
  );

  const getAriaProps = useCallback(
    (index: number) => ({
      role: "listitem",
      tabIndex: focusIndex === index ? 0 : -1,
      "aria-roledescription": "sortable item",
      "aria-describedby": "Use arrow keys to reorder. Press Home to move to start, End to move to end.",
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, index),
    }),
    [focusIndex, handleKeyDown],
  );

  return { focusIndex, setFocusIndex, getAriaProps };
}
