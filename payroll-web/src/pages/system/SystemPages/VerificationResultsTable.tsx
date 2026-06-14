import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AlertTriangle, CheckCircle } from "lucide-react";
import type { VerificationResult } from "./DatabasePage.types";

interface VerificationResultsTableProps {
  results: VerificationResult[];
  verifying: boolean;
  onRunVerification: () => void;
}

export function VerificationResultsTable({
  results,
  verifying,
  onRunVerification,
}: VerificationResultsTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Database Verification</CardTitle>
          <Button onClick={onRunVerification} disabled={verifying}>
            <CheckCircle className="w-4 h-4 mr-2" />
            {verifying ? "Verifying..." : "Run Verification"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {results.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            Click "Run Verification" to check database integrity
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Check Name
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Details
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Issues
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {results.map((result, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {result.name}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        result.status === "Pass"
                          ? "bg-green-100 text-green-800"
                          : result.status === "Fail"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {result.status === "Pass" && (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      )}
                      {result.status === "Fail" && (
                        <AlertTriangle className="w-3 h-3 mr-1" />
                      )}
                      {result.status === "Warning" && (
                        <AlertTriangle className="w-3 h-3 mr-1" />
                      )}
                      {result.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {result.details}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                    {result.issueCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
