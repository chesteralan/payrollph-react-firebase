import { useState, useCallback } from "react";

export function useQuickViewTooltip() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const showTooltip = useCallback((id: string, event: React.MouseEvent) => {
    setHoveredId(id);
    setPosition({ x: event.clientX, y: event.clientY });
  }, []);

  const hideTooltip = useCallback(() => {
    setHoveredId(null);
  }, []);

  return { hoveredId, position, showTooltip, hideTooltip, isVisible: hoveredId !== null };
}
