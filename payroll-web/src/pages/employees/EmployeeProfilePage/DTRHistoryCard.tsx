import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export function DTRHistoryCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>DTR History</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-gray-500 py-8">
          Attendance records will appear here once DTR entries are created.
        </p>
      </CardContent>
    </Card>
  );
}
