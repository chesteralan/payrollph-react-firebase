import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { Backup } from "./DatabasePage.types";

interface BackupHistoryTableProps {
  backups: Backup[];
}

export function BackupHistoryTable({ backups }: BackupHistoryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Date/Time
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Collections
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Documents
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Size
              </th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {backups.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  No backups yet
                </td>
              </tr>
            ) : (
              backups.map((backup) => (
                <tr key={backup.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {backup.timestamp
                      ? new Date(backup.timestamp).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {backup.collections?.length || 0} collections
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-right">
                    {backup.totalDocuments || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-right">
                    {backup.size
                      ? `${(backup.size / 1024).toFixed(1)} KB`
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        backup.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {backup.status || "unknown"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
