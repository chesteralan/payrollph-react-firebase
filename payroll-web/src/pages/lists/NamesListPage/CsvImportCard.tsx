import { useRef } from "react";
import { AlertCircle, Check, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { CsvPreviewRow } from "./NamesListPage.types";

interface CsvImportCardProps {
  csvPreview: CsvPreviewRow[];
  csvFileName: string;
  importStats: { success: number; failed: number; duplicates: number } | null;
  importing: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImport: () => void;
  onReset: () => void;
}

export function CsvImportCard({
  csvPreview,
  csvFileName,
  importStats,
  importing,
  onFileSelect,
  onImport,
  onReset,
}: CsvImportCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Import Names from CSV</CardTitle>
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!csvPreview.length && !importStats && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Upload a CSV file with names
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Format: firstName, lastName, middleName, suffix (or lastName,
              firstName middleName)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={onFileSelect}
              className="hidden"
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Select File
            </Button>
          </div>
        )}

        {csvFileName && csvPreview.length > 0 && !importStats && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                File: <span className="font-medium">{csvFileName}</span>
                <span className="ml-2">
                  ({csvPreview.length} rows found)
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-sm text-green-600">
                  {csvPreview.filter((r) => r.isValid).length} valid
                </span>
                <span className="text-sm text-red-600">
                  {csvPreview.filter((r) => !r.isValid).length} invalid
                </span>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2">#</th>
                    <th className="text-left px-3 py-2">First Name</th>
                    <th className="text-left px-3 py-2">Middle Name</th>
                    <th className="text-left px-3 py-2">Last Name</th>
                    <th className="text-left px-3 py-2">Suffix</th>
                    <th className="text-left px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {csvPreview.map((row, index) => (
                    <tr
                      key={index}
                      className={row.isValid ? "" : "bg-red-50"}
                    >
                      <td className="px-3 py-2 text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2">{row.firstName}</td>
                      <td className="px-3 py-2">{row.middleName}</td>
                      <td className="px-3 py-2">{row.lastName}</td>
                      <td className="px-3 py-2">{row.suffix}</td>
                      <td className="px-3 py-2">
                        {row.isValid ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 text-xs">
                            <AlertCircle className="w-3 h-3" />
                            {row.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={onReset}>
                Cancel
              </Button>
              <Button
                onClick={onImport}
                disabled={
                  importing ||
                  csvPreview.filter((r) => r.isValid).length === 0
                }
              >
                {importing
                  ? "Importing..."
                  : `Import ${csvPreview.filter((r) => r.isValid).length} Names`}
              </Button>
            </div>
          </div>
        )}

        {importStats && (
          <div className="text-center py-8">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Import Complete</h3>
            <p className="text-gray-600 mb-4">
              Successfully imported{" "}
              <span className="font-medium text-green-600">
                {importStats.success}
              </span>{" "}
              names
              {importStats.failed > 0 && (
                <span>
                  ,{" "}
                  <span className="font-medium text-red-600">
                    {importStats.failed}
                  </span>{" "}
                  failed
                </span>
              )}
              {importStats.duplicates > 0 && (
                <span>
                  ,{" "}
                  <span className="font-medium text-yellow-600">
                    {importStats.duplicates}
                  </span>{" "}
                  duplicates skipped
                </span>
              )}
            </p>
            <Button onClick={onReset}>Done</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
