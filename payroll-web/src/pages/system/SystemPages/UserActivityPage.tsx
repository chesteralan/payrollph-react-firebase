import { useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useActivityMonitor } from "@/hooks/useActivityMonitor";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

export function UserActivityPage() {
  const { canView } = usePermissions();
  const activity = useActivityMonitor();
  const [filter, setFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const filteredActivities = activity.activities
    .filter((a) => {
      if (filter && !a.entityType.toLowerCase().includes(filter.toLowerCase()))
        return false;
      if (actionFilter && a.action !== actionFilter) return false;
      return true;
    })
    .reverse();

  if (!canView("system", "users"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  const actionTypes = [...new Set(activity.activities.map((a) => a.action))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          User Activity Monitor
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{activity.activityCount} activities logged</span>
          {activity.lastActivity && (
            <span>
              Last: {activity.lastActivity.timestamp.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity Type
              </label>
              <input
                type="text"
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="e.g. payroll, employee"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="">All Actions</option>
                {actionTypes.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={activity.clearActivities}
            >
              Clear Log
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No activities recorded this session
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Time
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Entity
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredActivities.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {a.timestamp.toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {a.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {a.entityType}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {a.entityId || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
