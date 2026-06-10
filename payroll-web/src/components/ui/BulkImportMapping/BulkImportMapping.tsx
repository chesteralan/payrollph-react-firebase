import { useState, useRef } from "react";
import { clsx } from "clsx";
import { Upload, AlertCircle } from "lucide-react";

interface BulkImportMappingProps {
  onImport: (mappings: Record<string, string>, data: Record<string, string>[]) => void;
  expectedColumns: { key: string; label: string }[];
  className?: string;
}

export function BulkImportMapping({
  onImport,
  expectedColumns,
  className,
}: BulkImportMappingProps) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const parseFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        setError("File must have a header row and at least one data row");
        return;
      }
      const hdrs = lines[0].split(",").map((h) => h.trim());
      setHeaders(hdrs);
      const rows = lines.slice(1, 6).map((line) => {
        const vals = line.split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        hdrs.forEach((h, i) => {
          row[h] = vals[i] || "";
        });
        return row;
      });
      setPreview(rows);
      setError(null);
      // Auto-map
      const auto: Record<string, string> = {};
      expectedColumns.forEach((ec) => {
        const match = hdrs.find(
          (h) => h.toLowerCase().includes(ec.key.toLowerCase()) || h.toLowerCase().includes(ec.label.toLowerCase()),
        );
        if (match) auto[ec.key] = match;
      });
      setMapping(auto);
    };
    reader.readAsText(f);
  };

  const handleFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    parseFile(f);
  };

  const handleImport = () => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      const hdrs = lines[0].split(",").map((h) => h.trim());
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        hdrs.forEach((h, i) => {
          row[h] = vals[i] || "";
        });
        return row;
      });
      onImport(mapping, rows);
    };
    if (file) reader.readAsText(file);
  };

  return (
    <div className={clsx("space-y-4", className)}>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files[0]);
        }}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.txt"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
          className="hidden"
        />
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Drop CSV file here or click to browse</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {headers.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Column Mapping</h4>
          {expectedColumns.map((ec) => (
            <div key={ec.key} className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-32">{ec.label}</span>
              <select
                value={mapping[ec.key] || ""}
                onChange={(e) =>
                  setMapping((prev) => ({ ...prev, [ec.key]: e.target.value }))
                }
                className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
              >
                <option value="">— Skip —</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {preview.length > 0 && (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-2 py-1 text-left font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} className="border-t border-gray-100">
                  {headers.map((h) => (
                    <td key={h} className="px-2 py-1 text-gray-700">{row[h]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {file && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleImport}
            disabled={Object.values(mapping).filter(Boolean).length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            Import {file.name}
          </button>
        </div>
      )}
    </div>
  );
}
