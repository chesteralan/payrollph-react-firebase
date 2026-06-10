import { useState, useRef, useCallback, type ReactNode } from "react";
import { clsx } from "clsx";
import { GripVertical } from "lucide-react";

interface ResizableColumnProps {
  children: ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  onResize?: (width: number) => void;
  className?: string;
}

export function ResizableColumn({
  children,
  defaultWidth = 150,
  minWidth = 60,
  onResize,
  className,
}: ResizableColumnProps) {
  const [width, setWidth] = useState(defaultWidth);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startXRef.current = e.clientX;
      startWidthRef.current = width;

      const handleMouseMove = (ev: MouseEvent) => {
        const diff = ev.clientX - startXRef.current;
        const newWidth = Math.max(minWidth, startWidthRef.current + diff);
        setWidth(newWidth);
        onResize?.(newWidth);
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [width, minWidth, onResize],
  );

  return (
    <th
      className={clsx("relative select-none", className)}
      style={{ width, minWidth }}
    >
      <div className="flex items-center gap-1">
        <GripVertical className="w-3 h-3 text-gray-300 cursor-grab" />
        {children}
      </div>
      <div
        onMouseDown={handleMouseDown}
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary-400 active:bg-primary-600"
        role="separator"
        aria-label="Resize column"
      />
    </th>
  );
}
