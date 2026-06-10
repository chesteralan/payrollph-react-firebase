import { clsx } from "clsx";

interface WidgetLayoutProps {
  children: React.ReactNode[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function WidgetLayout({
  children,
  columns = 2,
  className,
}: WidgetLayoutProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={clsx("grid gap-4", gridCols[columns], className)}>
      {children.map((child, i) => (
        <div key={i} className="min-h-0">
          {child}
        </div>
      ))}
    </div>
  );
}
