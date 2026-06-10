import { useState } from "react";
import { clsx } from "clsx";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface PaginatedTableProps<T> {
  data: T[];
  pageSize?: number;
  children: (items: T[]) => React.ReactNode;
  className?: string;
}

export function PaginatedTable<T>({
  data,
  pageSize = 25,
  children,
  className,
}: PaginatedTableProps<T>) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(data.length / pageSize);
  const items = data.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className={clsx("space-y-2", className)}>
      {children(items)}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-1.5 text-xs text-gray-500">
          <span>
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, data.length)} of{" "}
            {data.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                className={clsx(
                  "w-6 h-6 rounded text-xs font-medium",
                  i === page
                    ? "bg-primary-100 text-primary-700"
                    : "text-gray-500 hover:bg-gray-100",
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
