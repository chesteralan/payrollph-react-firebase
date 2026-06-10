import { useState, useRef, useCallback, type ReactNode } from "react";
import { clsx } from "clsx";
import { GripVertical } from "lucide-react";

interface ColumnReorderProps {
  children: ReactNode[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  className?: string;
}

export function ColumnReorder({
  children,
  onReorder,
  className,
}: ColumnReorderProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLElement | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      setDragIndex(index);
      dragNodeRef.current = e.target as HTMLElement;
      e.dataTransfer.effectAllowed = "move";
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setOverIndex(index);
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (dragIndex !== null && dragIndex !== dropIndex) {
        onReorder(dragIndex, dropIndex);
      }
      setDragIndex(null);
      setOverIndex(null);
    },
    [dragIndex, onReorder],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  return (
    <div className={clsx("flex", className)}>
      {children.map((child, index) => (
        <div
          key={index}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={clsx(
            "relative transition-all duration-200",
            dragIndex === index && "opacity-50",
            overIndex === index && "scale-105",
          )}
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 cursor-grab opacity-0 hover:opacity-100">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          {child}
        </div>
      ))}
    </div>
  );
}
