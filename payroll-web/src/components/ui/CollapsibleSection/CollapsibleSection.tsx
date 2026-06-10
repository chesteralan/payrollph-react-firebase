import { useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  badge,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={clsx("border border-gray-200 rounded-lg", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-t-lg transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {badge}
        </div>
        <ChevronDown
          className={clsx(
            "w-4 h-4 text-gray-500 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
}
