import { clsx } from "clsx";
import { Filter, X } from "lucide-react";
import { useState } from "react";

interface ResponsiveFilterPanelProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function ResponsiveFilterPanel({
  children,
  title = "Filters",
  className,
}: ResponsiveFilterPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop: inline */}
      <div className={clsx("hidden md:block", className)}>{children}</div>

      {/* Mobile: slide-up drawer */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
        >
          <Filter className="w-4 h-4" />
          {title}
        </button>
        {open && (
          <div className="fixed inset-0 z-50 flex flex-col bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-sm font-semibold">{title}</h3>
              <button type="button" onClick={() => setOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </div>
        )}
      </div>
    </>
  );
}
