import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "../Button";

interface BulkStatusChangeProps {
  open: boolean;
  onClose: () => void;
  onApply: (newStatus: string, reason: string) => void;
  statuses: { value: string; label: string }[];
  selectedCount: number;
}

export function BulkStatusChange({
  open,
  onClose,
  onApply,
  statuses,
  selectedCount,
}: BulkStatusChangeProps) {
  const [newStatus, setNewStatus] = useState("");
  const [reason, setReason] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Change Status</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Update status for {selectedCount} selected item{(selectedCount || 0) > 1 ? "s" : ""}
        </p>
        <div className="space-y-3">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
          >
            <option value="">Select status...</option>
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for change (optional)"
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none"
          />
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onApply(newStatus, reason)} disabled={!newStatus}>
            Apply to {selectedCount}
          </Button>
        </div>
      </div>
    </div>
  );
}
