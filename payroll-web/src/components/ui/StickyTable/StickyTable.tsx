import { clsx } from "clsx";
import type { ReactNode, CSSProperties } from "react";

interface StickyTableProps {
  children: ReactNode;
  stickyColumns?: number;
  className?: string;
  style?: CSSProperties;
}

export function StickyTable({
  children,
  className,
  style,
}: StickyTableProps) {
  return (
    <div
      className={clsx("overflow-x-auto relative", className)}
      style={style}
    >
      <style>{`
        .sticky-col {
          position: sticky;
          z-index: 2;
          background-color: inherit;
        }
        .sticky-col.header-cell {
          z-index: 3;
        }
        .sticky-col-1 { left: 0; }
        .sticky-col-2 { left: var(--col-width, 150px); }
      `}</style>
      <div className="min-w-max">{children}</div>
    </div>
  );
}

export function StickyCell({
  children,
  column = 1,
  className,
  as: Tag = "td",
  ...props
}: {
  children: ReactNode;
  column?: number;
  className?: string;
  as?: "td" | "th";
  [key: string]: unknown;
}) {
  return (
    <Tag
      className={clsx(
        "sticky-col",
        `sticky-col-${column}`,
        Tag === "th" && "header-cell",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
