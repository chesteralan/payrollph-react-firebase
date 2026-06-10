import { useState, useEffect, type ReactNode } from "react";
import { clsx } from "clsx";

interface ProgressiveLoadProps {
  children: ReactNode;
  loadingComponent?: ReactNode;
  threshold?: number;
  className?: string;
}

export function ProgressiveLoad({
  children,
  loadingComponent,
  threshold = 100,
  className,
}: ProgressiveLoadProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), threshold);
    return () => clearTimeout(timer);
  }, [threshold]);

  if (!visible) {
    return (
      <div className={clsx(className)}>
        {loadingComponent || (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
