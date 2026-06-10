import { useCallback } from "react";

interface DataExportButtonProps {
  fileName?: string;
}

export function useDataExport({ fileName = "export" }: DataExportButtonProps = {}) {
  const exportAsCSV = useCallback(
    (data: Record<string, unknown>[], columns: string[]) => {
      const headers = columns.join(",");
      const rows = data.map((row) =>
        columns.map((col) => {
          const val = row[col];
          const str = val == null ? "" : String(val);
          return str.includes(",") ? `"${str}"` : str;
        }).join(","),
      );
      const csv = [headers, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [fileName],
  );

  const exportAsJSON = useCallback(
    (data: Record<string, unknown>[]) => {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [fileName],
  );

  return { exportAsCSV, exportAsJSON };
}
