import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { X } from "lucide-react";
import type { DTRPageBenefit, DTRPageLeaveForm } from "./DTRPage.types";

interface LeaveApplicationModalProps {
  show: boolean;
  leaveForm: DTRPageLeaveForm;
  benefits: DTRPageBenefit[];
  onClose: () => void;
  onChange: (form: DTRPageLeaveForm) => void;
  onSubmit: () => void;
}

function calcLeaveDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function LeaveApplicationModal({
  show,
  leaveForm,
  benefits,
  onClose,
  onChange,
  onSubmit,
}: LeaveApplicationModalProps) {
  if (!show) return null;

  const totalDays = calcLeaveDays(leaveForm.startDate, leaveForm.endDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Apply for Leave</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leave Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={leaveForm.benefitId}
              onChange={(e) =>
                onChange({ ...leaveForm, benefitId: e.target.value })
              }
            >
              <option value="">Select leave type</option>
              {benefits.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="startDate"
              label="Start Date"
              type="date"
              value={leaveForm.startDate}
              onChange={(e) =>
                onChange({ ...leaveForm, startDate: e.target.value })
              }
            />
            <Input
              id="endDate"
              label="End Date"
              type="date"
              value={leaveForm.endDate}
              onChange={(e) =>
                onChange({ ...leaveForm, endDate: e.target.value })
              }
            />
          </div>
          {leaveForm.startDate && leaveForm.endDate && (
            <p className="text-sm text-gray-600">
              Total Days:{" "}
              <span className="font-medium">{totalDays}</span>
            </p>
          )}
          <Input
            id="reason"
            label="Reason"
            value={leaveForm.reason}
            onChange={(e) =>
              onChange({ ...leaveForm, reason: e.target.value })
            }
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>Submit Application</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
