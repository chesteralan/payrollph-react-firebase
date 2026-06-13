import { memo, useRef, useState } from "react";
import { clsx } from "clsx";

interface EditableCellProps {
  value: string | number;
  originalValue?: string | number;
  onChange: (value: string) => void;
  type?: "text" | "number";
  className?: string;
}

export const EditableCell = memo(function EditableCell({
  value,
  originalValue,
  onChange,
  type = "text",
  className,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(String(value));
  const [highlight, setHighlight] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasChanged =
    originalValue !== undefined && String(value) !== String(originalValue);

  const triggerHighlight = () => {
    setHighlight(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setHighlight(false), 2000);
  };

  if (editing) {
    return (
      <input
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (localValue !== String(value)) triggerHighlight();
          onChange(localValue);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setEditing(false);
            if (localValue !== String(value)) triggerHighlight();
            onChange(localValue);
          }
          if (e.key === "Escape") {
            setEditing(false);
            setLocalValue(String(value));
          }
        }}
        className="w-full px-2 py-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
        autoFocus
      />
    );
  }

  return (
    <div
      onClick={() => {
        setEditing(true);
        setLocalValue(String(value));
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setEditing(true);
          setLocalValue(String(value));
        }
      }}
      className={clsx(
        "px-2 py-1 text-sm rounded cursor-pointer hover:bg-primary-50 transition-colors duration-500",
        highlight && "bg-yellow-200 animate-pulse",
        hasChanged && !highlight && "bg-yellow-100",
        className,
      )}
      role="button"
      tabIndex={0}
      aria-label={`Edit value: ${type === "number" ? Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}`}
    >
      {type === "number"
        ? Number(value).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : value}
    </div>
  );
});
