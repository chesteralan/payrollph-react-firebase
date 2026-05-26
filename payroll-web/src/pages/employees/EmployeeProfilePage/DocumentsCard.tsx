import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Upload, Download, File, Trash2 } from "lucide-react";
import type {
  EmployeeDocument,
  DocumentCategory,
} from "./EmployeeProfilePage.types";

interface DocumentsCardProps {
  documents: EmployeeDocument[];
  selectedFile: File | null;
  uploading: boolean;
  uploadProgress: number;
  docCategory: DocumentCategory;
  docNotes: string;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDocCategoryChange: (category: DocumentCategory) => void;
  onDocNotesChange: (notes: string) => void;
  onUpload: () => void;
  onDeleteDocument: (doc: EmployeeDocument) => void;
  formatFileSize: (bytes: number) => string;
}

export function DocumentsCard({
  documents,
  selectedFile,
  uploading,
  uploadProgress,
  docCategory,
  docNotes,
  onFileSelect,
  onDocCategoryChange,
  onDocNotesChange,
  onUpload,
  onDeleteDocument,
  formatFileSize,
}: DocumentsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Upload New Document
          </h3>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
              <input
                type="file"
                id="fileUpload"
                className="hidden"
                onChange={onFileSelect}
              />
              <label htmlFor="fileUpload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {selectedFile
                    ? selectedFile.name
                    : "Click to select a file or drag and drop"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Any file type supported
                </p>
              </label>
            </div>

            {selectedFile && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={docCategory}
                    onChange={(e) =>
                      onDocCategoryChange(e.target.value as DocumentCategory)
                    }
                  >
                    <option value="ID">ID</option>
                    <option value="Contract">Contract</option>
                    <option value="Tax Form">Tax Form</option>
                    <option value="Medical">Medical</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Add notes about this document"
                    value={docNotes}
                    onChange={(e) => onDocNotesChange(e.target.value)}
                  />
                </div>
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {selectedFile && (
              <div className="flex justify-end">
                <Button onClick={onUpload} disabled={uploading}>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Document"}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Uploaded Documents
          </h3>
          {documents.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No documents uploaded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">
                      File Name
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">
                      Category
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">
                      Size
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">
                      Upload Date
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <File className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {doc.fileName}
                          </span>
                        </div>
                        {doc.notes && (
                          <p className="text-xs text-gray-500 mt-0.5 ml-6">
                            {doc.notes}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {doc.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-500">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="py-3 px-3 text-gray-500">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex justify-end gap-2">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <ConfirmDialog
                            title="Delete Document"
                            message={`Delete "${doc.fileName}"? This action cannot be undone.`}
                            confirmText="Delete"
                            onConfirm={() => onDeleteDocument(doc)}
                          >
                            {(open: () => void) => (
                              <button
                                onClick={open}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </ConfirmDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
