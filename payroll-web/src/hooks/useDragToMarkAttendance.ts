import { useCallback, useRef } from "react";

export function useDragToMarkAttendance() {
  const isDraggingRef = useRef(false);
  const markedDatesRef = useRef<Set<string>>(new Set());

  const startDrag = useCallback((date: string) => {
    isDraggingRef.current = true;
    markedDatesRef.current.add(date);
  }, []);

  const continueDrag = useCallback((date: string) => {
    if (isDraggingRef.current) {
      markedDatesRef.current.add(date);
    }
  }, []);

  const endDrag = useCallback(() => {
    isDraggingRef.current = false;
    const result = new Set(markedDatesRef.current);
    markedDatesRef.current.clear();
    return result;
  }, []);

  const getDragProps = useCallback(
    (date: string) => ({
      onMouseDown: () => startDrag(date),
      onMouseEnter: () => continueDrag(date),
      onMouseUp: () => endDrag(),
      onTouchStart: () => startDrag(date),
      onTouchMove: () => continueDrag(date),
      onTouchEnd: () => endDrag(),
    }),
    [startDrag, continueDrag, endDrag, date],
  );

  return { getDragProps };
}
