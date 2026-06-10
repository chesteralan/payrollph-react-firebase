import { useState } from "react";
import { clsx } from "clsx";
import { Smartphone, Tablet, Monitor } from "lucide-react";

interface MobileResponsivePreviewProps {
  children: React.ReactNode;
}

type Viewport = "mobile" | "tablet" | "desktop";

const VIEWPORT_SIZES: Record<Viewport, { width: number; label: string; icon: typeof Smartphone }> = {
  mobile: { width: 375, label: "Mobile", icon: Smartphone },
  tablet: { width: 768, label: "Tablet", icon: Tablet },
  desktop: { width: 1280, label: "Desktop", icon: Monitor },
};

export function MobileResponsivePreview({
  children,
}: MobileResponsivePreviewProps) {
  const [viewport, setViewport] = useState<Viewport>("desktop");

  const size = VIEWPORT_SIZES[viewport];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
        {(Object.entries(VIEWPORT_SIZES) as [Viewport, typeof size][]).map(
          ([key, val]) => {
            const Icon = val.icon;
            const active = viewport === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setViewport(key)}
                className={clsx(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                  active
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{val.label}</span>
                <span className="text-[10px] text-gray-400">{val.width}px</span>
              </button>
            );
          },
        )}
      </div>
      <div
        className="overflow-auto border border-gray-200 rounded-lg bg-white mx-auto transition-all"
        style={{ maxWidth: size.width }}
      >
        {children}
      </div>
    </div>
  );
}
