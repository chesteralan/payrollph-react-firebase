import { clsx } from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, type ReactNode } from "react";

interface DrillDownTableProps {
  columns: { key: string; label: string; render?: (value: unknown) => ReactNode }[];
  rows: Record<string, unknown>[];
  detailRender: (row: Record<string, unknown>) => ReactNode;
  className?: string;
}

export function DrillDownTable({
  columns,
  rows,
  detailRender,
  className,
}: DrillDownTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  return (
    <div className={clsx("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="w-8 px-2 py-2" />
            {columns.map((col) => (
              <th key={col.key} className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => {
            const rowId = String(row.id || i);
            const expanded = expandedRow === rowId;
            return (
              <>
                <tr
                  key={rowId}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedRow(expanded ? null : rowId)}
                >
                  <td className="px-2 py-2">
                    {expanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </td>
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-2 text-gray-900">
                      {col.render ? col.render(row[col.key]) : String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
                {expanded && (
                  <tr key={`${rowId}-detail`}>
                    <td colSpan={columns.length + 1} className="bg-gray-50 px-4 py-3">
                      {detailRender(row)}
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
