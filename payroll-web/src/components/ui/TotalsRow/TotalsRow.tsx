import { clsx } from "clsx";
import type { ReactNode } from "react";

interface TotalsRowProps {
  columns: (string | number | ReactNode)[];
  className?: string;
  colSpan?: number;
}

export function TotalsRow({
  columns,
  className,
  colSpan,
}: TotalsRowProps) {
  return (
    <tfoot className={clsx("sticky bottom-0 z-10", className)}>
      <tr className="bg-primary-50 border-t-2 border-primary-300 font-semibold text-primary-900">
        {columns.map((col, i) => (
          <td
            key={i}
            colSpan={i === 0 && colSpan ? colSpan : 1}
            className={clsx(
              "px-3 py-2 text-xs whitespace-nowrap",
              typeof col === "number" && "text-right font-mono",
              i === 0 && "sticky left-0 bg-primary-50 z-10",
            )}
          >
            {i === 0 && colSpan ? null : col}
          </td>
        ))}
      </tr>
    </tfoot>
  );
}
