import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import type {
  EmployeeArea,
  EmployeeGroup,
  EmployeePosition,
  EmployeeStatus,
} from "@/types/employee";

interface BulkEditCardProps {
  isOpen: boolean;
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
  isOpen,
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
    <Sheet
      isOpen={isOpen}
      onClose={onCancel}
      title={`Bulk Edit ${selectedCount} Name${selectedCount !== 1 ? "s" : ""}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onApply} disabled={bulkLoading || !hasAnyValue}>
            {bulkLoading ? "Updating..." : "Apply Changes"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
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
    </Sheet>
  );
}
