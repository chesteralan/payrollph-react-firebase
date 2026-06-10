import { Eye, Download, X, FileText } from "lucide-react";
import { Button } from "../Button";

interface DocumentViewerProps {
  open: boolean;
  onClose: () => void;
  url?: string;
  fileName: string;
  fileType?: "pdf" | "image" | "other";
}

export function DocumentViewer({
  open,
  onClose,
  url,
  fileName,
  fileType = "pdf",
}: DocumentViewerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-gray-900/90">
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{fileName}</span>
          </div>
          <div className="flex items-center gap-2">
            {url && (
              <Button size="sm" variant="secondary" onClick={() => window.open(url, "_blank")}>
                <Download className="w-3.5 h-3.5 mr-1" />
                Download
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          {fileType === "pdf" && url ? (
            <iframe
              src={url}
              className="w-full h-full max-w-4xl rounded-lg shadow-lg bg-white"
              title={fileName}
            />
          ) : fileType === "image" && url ? (
            <img
              src={url}
              alt={fileName}
              className="max-w-full max-h-full rounded-lg shadow-lg object-contain"
            />
          ) : (
            <div className="text-center text-gray-400">
              <Eye className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Preview not available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
