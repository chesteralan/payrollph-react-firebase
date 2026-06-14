import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Trash2, X } from "lucide-react";
import { MONTH_NAMES } from "./DTRPage.constants";
import type { DTREntry } from "@/types/dtr";
import type { DTRPageDayForm } from "./DTRPage.types";

interface DayEntryModalProps {
  show: boolean;
  selectedDay: number | null;
  selectedMonth: number;
  selectedYear: number;
  dayForm: DTRPageDayForm;
  hasExistingEntry: boolean;
  canDelete: boolean;
  hoursWorked: number;
  onClose: () => void;
  onChange: (form: DTRPageDayForm) => void;
  onSave: () => void;
  onDelete: () => void;
}

export function DayEntryModal({
  show,
  selectedDay,
  selectedMonth,
  selectedYear,
  dayForm,
  hasExistingEntry,
  canDelete,
  hoursWorked,
  onClose,
  onChange,
  onSave,
  onDelete,
}: DayEntryModalProps) {
  if (!show || selectedDay === null) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {MONTH_NAMES[selectedMonth]} {selectedDay}, {selectedYear}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="timeIn"
              label="Time In"
              type="time"
              value={dayForm.timeIn}
              onChange={(e) =>
                onChange({ ...dayForm, timeIn: e.target.value })
              }
            />
            <Input
              id="timeOut"
              label="Time Out"
              type="time"
              value={dayForm.timeOut}
              onChange={(e) =>
                onChange({ ...dayForm, timeOut: e.target.value })
              }
            />
          </div>
          {dayForm.timeIn && dayForm.timeOut && (
            <p className="text-sm text-gray-600">
              Hours Worked:{" "}
              <span className="font-medium">{hoursWorked}</span>
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="lateHours"
              label="Late Hours"
              type="number"
              step="0.5"
              min="0"
              value={dayForm.lateHours}
              onChange={(e) =>
                onChange({
                  ...dayForm,
                  lateHours: Number(e.target.value),
                })
              }
            />
            <Input
              id="overtimeHours"
              label="Overtime Hours"
              type="number"
              step="0.5"
              min="0"
              value={dayForm.overtimeHours}
              onChange={(e) =>
                onChange({
                  ...dayForm,
                  overtimeHours: Number(e.target.value),
                })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Absence Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={dayForm.absenceType}
              onChange={(e) =>
                onChange({
                  ...dayForm,
                  absenceType: e.target.value as DTREntry["absenceType"],
                })
              }
            >
              <option value="">None</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="undertime">Undertime</option>
              <option value="sick">Sick Leave</option>
              <option value="vacation">Vacation Leave</option>
            </select>
          </div>
          {dayForm.absenceType && (
            <Input
              id="absenceReason"
              label="Absence Reason"
              value={dayForm.absenceReason}
              onChange={(e) =>
                onChange({ ...dayForm, absenceReason: e.target.value })
              }
            />
          )}
          <Input
            id="notes"
            label="Notes"
            value={dayForm.notes}
            onChange={(e) =>
              onChange({ ...dayForm, notes: e.target.value })
            }
          />
          <div className="flex items-center justify-between pt-2">
            {canDelete && hasExistingEntry && (
              <ConfirmDialog
                title="Delete Entry"
                message="Delete this DTR entry?"
                confirmText="Delete"
                onConfirm={onDelete}
              >
                {(open) => (
                  <Button variant="ghost" size="sm" onClick={open}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </ConfirmDialog>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={onSave}>Save</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
