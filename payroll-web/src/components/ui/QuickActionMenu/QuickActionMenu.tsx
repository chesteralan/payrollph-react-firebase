import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { MoreVertical, Copy } from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  icon?: typeof MoreVertical;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface QuickActionMenuProps {
  actions: QuickAction[];
  align?: "left" | "right";
  className?: string;
}

export function QuickActionMenu({
  actions,
  align = "right",
  className,
}: QuickActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={menuRef} className={clsx("relative inline-block", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1 rounded hover:bg-gray-100 transition-colors"
        aria-label="Quick actions"
        aria-expanded={open}
      >
        <MoreVertical className="w-4 h-4 text-gray-400" />
      </button>
      {open && (
        <div
          className={clsx(
            "absolute z-20 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1",
            align === "right" ? "right-0" : "left-0",
          )}
          role="menu"
        >
          {actions.map((action) => {
            const Icon = action.icon || Copy;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => {
                  action.onClick();
                  setOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                  action.variant === "danger"
                    ? "text-red-600 hover:bg-red-50"
                    : "text-gray-700 hover:bg-gray-50",
                )}
                role="menuitem"
              >
                <Icon className="w-4 h-4 shrink-0" />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
