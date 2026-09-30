import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import type { CalendarFormData } from "./useCalendarPage";

interface CalendarEventFormProps {
  isOpen: boolean;
  formData: CalendarFormData;
  editingId: string | null;
  onFormDataChange: (data: CalendarFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function CalendarEventForm({
  isOpen,
  formData,
  editingId,
  onFormDataChange,
  onSubmit,
  onCancel,
}: CalendarEventFormProps) {
  return (
    <Sheet
      isOpen={isOpen}
      onClose={onCancel}
      title={editingId ? "Edit Calendar Entry" : "Add Calendar Entry"}
      footer={
        <div className="flex gap-2">
          <Button type="submit" form="calendar-event-form">
            {editingId ? "Update" : "Create"}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      }
    >
      <form id="calendar-event-form" onSubmit={onSubmit} className="space-y-4">
        <Input
          id="date"
          label="Date"
          type="date"
          value={formData.date}
          onChange={(e) =>
            onFormDataChange({ ...formData, date: e.target.value })
          }
          required
        />
        <Input
          id="name"
          label="Name"
          value={formData.name}
          onChange={(e) =>
            onFormDataChange({ ...formData, name: e.target.value })
          }
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={formData.type}
            onChange={(e) =>
              onFormDataChange({
                ...formData,
                type: e.target.value as "holiday" | "special" | "workday",
              })
            }
          >
            <option value="holiday">Regular Holiday</option>
            <option value="special">Special Holiday</option>
            <option value="workday">Special Workday</option>
          </select>
        </div>
        <div className="flex items-center">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isPaid}
              onChange={(e) =>
                onFormDataChange({ ...formData, isPaid: e.target.checked })
              }
              className="rounded border-gray-300"
            />
            <span className="text-sm">Paid Holiday</span>
          </label>
        </div>
      </form>
    </Sheet>
  );
}
