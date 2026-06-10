import { clsx } from "clsx";
import { FileText, FileSpreadsheet, FileJson, Eye } from "lucide-react";
import { Button } from "../Button";

interface ReportExportOptionsProps {
  onExportXLS: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onPreview?: () => void;
  className?: string;
}

export function ReportExportOptions({
  onExportXLS,
  onExportCSV,
  onExportJSON,
  onPreview,
  className,
}: ReportExportOptionsProps) {
  return (
    <div className={clsx("flex items-center gap-1.5", className)}>
      {onPreview && (
        <Button size="sm" variant="secondary" onClick={onPreview}>
          <Eye className="w-3.5 h-3.5 mr-1" />
          Preview
        </Button>
      )}
      <Button size="sm" variant="secondary" onClick={onExportXLS}>
        <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
        XLS
      </Button>
      <Button size="sm" variant="secondary" onClick={onExportCSV}>
        <FileText className="w-3.5 h-3.5 mr-1" />
        CSV
      </Button>
      <Button size="sm" variant="secondary" onClick={onExportJSON}>
        <FileJson className="w-3.5 h-3.5 mr-1" />
        JSON
      </Button>
    </div>
  );
}
