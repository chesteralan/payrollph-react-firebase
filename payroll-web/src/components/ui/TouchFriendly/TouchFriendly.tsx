import { clsx } from "clsx";
import type { ReactNode, TouchEvent } from "react";
import { useCallback, useRef } from "react";

interface TouchFriendlyProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  threshold?: number;
}

export function TouchFriendly({
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
  threshold = 50,
}: TouchFriendlyProps) {
  const startXRef = useRef(0);
  const startYRef = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      const diffX = e.changedTouches[0].clientX - startXRef.current;
      const diffY = e.changedTouches[0].clientY - startYRef.current;
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
        if (diffX > 0) onSwipeRight?.();
        else onSwipeLeft?.();
      }
    },
    [onSwipeLeft, onSwipeRight, threshold],
  );

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={clsx(className)}
    >
      {children}
    </div>
  );
}
