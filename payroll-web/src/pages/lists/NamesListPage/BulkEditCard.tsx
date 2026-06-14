import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { EmployeeArea, EmployeeGroup, EmployeePosition, EmployeeStatus } from "@/types/employee";

interface BulkEditCardProps {
  selectedCount: number;
  groups: EmployeeGroup[];
  positions: EmployeePosition[];
  areas: EmployeeArea[];
  statuses: EmployeeStatus[];
  bulkEditData: {
    groupId: string;
    positionId: string;
    areaId: string;
    statusId: string;
  };
  bulkLoading: boolean;
  onUpdate: (field: string, value: string) => void;
  onApply: () => void;
  onCancel: () => void;
}

export function BulkEditCard({
  selectedCount,
  groups,
  positions,
  areas,
  statuses,
  bulkEditData,
  bulkLoading,
  onUpdate,
  onApply,
  onCancel,
}: BulkEditCardProps) {
  const hasAnyValue = Object.values(bulkEditData).some((v) => v);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Bulk Edit {selectedCount} Name{selectedCount !== 1 ? "s" : ""}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group
            </label>
            <select
              value={bulkEditData.groupId}
              onChange={(e) => onUpdate("groupId", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">-- No Change --</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <select
              value={bulkEditData.positionId}
              onChange={(e) => onUpdate("positionId", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">-- No Change --</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Area
            </label>
            <select
              value={bulkEditData.areaId}
              onChange={(e) => onUpdate("areaId", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">-- No Change --</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={bulkEditData.statusId}
              onChange={(e) => onUpdate("statusId", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">-- No Change --</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onApply}
            disabled={bulkLoading || !hasAnyValue}
          >
            {bulkLoading ? "Updating..." : "Apply Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
