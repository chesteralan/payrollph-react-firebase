import { useEffect, useCallback } from "react";

export function useLazyLoading(
  containerRef: React.RefObject<HTMLElement | null>,
  onLoadMore: () => void,
  threshold = 200,
) {
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollHeight - scrollTop - clientHeight < threshold) {
      onLoadMore();
    }
  }, [containerRef, onLoadMore, threshold]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [containerRef, handleScroll]);
}
