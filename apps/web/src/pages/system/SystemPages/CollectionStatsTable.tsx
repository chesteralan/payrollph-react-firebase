import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Download } from "lucide-react";
import { COLLECTIONS } from "./SystemPages.constants";

interface CollectionStatsTableProps {
  stats: Record<string, number>;
  loading: boolean;
  exportLoading: string;
  exportCollection: (collectionName: string) => void;
}

export function CollectionStatsTable({
  stats,
  loading,
  exportLoading,
  exportCollection,
}: CollectionStatsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Collection Statistics</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Collection
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Documents
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : (
              COLLECTIONS.map((col) => (
                <tr key={col} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {col}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-right">
                    {stats[col] || 0}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!!exportLoading}
                      onClick={() => exportCollection(col)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      {exportLoading === col ? "Exporting..." : "Export"}
                    </Button>
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
