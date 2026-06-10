import { clsx } from "clsx";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface ResponsiveSidebarProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function ResponsiveSidebar({
  open,
  onClose,
  children,
  className,
}: ResponsiveSidebarProps) {
  return (
    <>
      {/* Desktop sidebar - always visible */}
      <aside className={clsx("hidden lg:flex lg:flex-col w-64 shrink-0", className)}>
        {children}
      </aside>

      {/* Mobile overlay sidebar */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside
            className={clsx(
              "fixed top-0 left-0 bottom-0 w-72 bg-white shadow-xl z-50 overflow-y-auto",
              className,
            )}
          >
            <div className="flex justify-end p-2">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded hover:bg-gray-100"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {children}
          </aside>
        </div>
      )}
    </>
  );
}
