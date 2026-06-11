import { clsx } from "clsx";
import { Download } from "lucide-react";

interface PdfExportButtonProps {
  onExport: () => void;
  format?: "PDF" | "XLS" | "CSV";
  className?: string;
}

export function PdfExportButton({
  onExport,
  format = "PDF",
  className,
}: PdfExportButtonProps) {
  return (
    <button
      type="button"
      onClick={onExport}
      className={clsx(
        "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
        "border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800",
        className,
      )}
    >
      <Download className="w-3.5 h-3.5" />
      Export {format}
    </button>
  );
}
