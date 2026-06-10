import { useCallback, useState } from "react";

export function useDynamicXlsxImport() {
  const [loading, setLoading] = useState(false);
  const [xlsxModule, setXlsxModule] = useState<typeof import("xlsx") | null>(null);

  const loadXlsx = useCallback(async () => {
    if (xlsxModule) return xlsxModule;
    setLoading(true);
    try {
      const mod = await import("xlsx");
      setXlsxModule(mod);
      return mod;
    } finally {
      setLoading(false);
    }
  }, [xlsxModule]);

  const exportToXLSX = useCallback(
    async (data: Record<string, unknown>[], filename: string) => {
      const XLSX = await loadXlsx();
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data");
      XLSX.writeFile(wb, `${filename}.xlsx`);
    },
    [loadXlsx],
  );

  return { exportToXLSX, loading, loaded: !!xlsxModule };
}
