import { useState, useRef } from "react";
import { clsx } from "clsx";
import { Eye, EyeOff, X, Monitor, Smartphone } from "lucide-react";

interface CssToggle {
  key: string;
  label: string;
  css: string;
  defaultOn?: boolean;
}

interface PrintPreviewProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  cssToggles?: CssToggle[];
}

export function PrintPreview({
  open,
  onClose,
  children,
  title = "Print Preview",
  cssToggles = [],
}: PrintPreviewProps) {
  const [activeToggles, setActiveToggles] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(cssToggles.map((t) => [t.key, t.defaultOn ?? true])),
  );
  const [mobileView, setMobileView] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  const toggleCss = (key: string) =>
    setActiveToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  const activeCss = cssToggles
    .filter((t) => activeToggles[t.key])
    .map((t) => t.css)
    .join("\n");

  return (
    <div className="fixed inset-0 z-50 flex bg-gray-900/80">
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {cssToggles.map((toggle) => (
              <button
                key={toggle.key}
                type="button"
                onClick={() => toggleCss(toggle.key)}
                className={clsx(
                  "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                  activeToggles[toggle.key]
                    ? "bg-primary-100 text-primary-700"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                )}
              >
                {activeToggles[toggle.key] ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <EyeOff className="w-3 h-3" />
                )}
                {toggle.label}
              </button>
            ))}
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <button
              type="button"
              onClick={() => setMobileView(false)}
              className={clsx(
                "p-1.5 rounded transition-colors",
                !mobileView
                  ? "bg-gray-200 text-gray-700"
                  : "text-gray-400 hover:text-gray-600",
              )}
              aria-label="Desktop view"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileView(true)}
              className={clsx(
                "p-1.5 rounded transition-colors",
                mobileView
                  ? "bg-gray-200 text-gray-700"
                  : "text-gray-400 hover:text-gray-600",
              )}
              aria-label="Mobile view"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 flex justify-center">
          <style>{activeCss}</style>
          <div
            ref={contentRef}
            className={clsx(
              "bg-white shadow-lg transition-all",
              mobileView ? "w-[375px]" : "w-full max-w-4xl",
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
