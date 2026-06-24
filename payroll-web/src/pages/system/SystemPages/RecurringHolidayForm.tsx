import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Calendar as CalendarIcon } from "lucide-react";
import type { RecurringFormData } from "./useCalendarPage";

interface RecurringHolidayFormProps {
  formData: RecurringFormData;
  onFormDataChange: (data: RecurringFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function RecurringHolidayForm({
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
}: RecurringHolidayFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <CalendarIcon className="w-4 h-4 mr-2 inline" />
          Create Recurring Holiday
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="recurringName"
              label="Holiday Name"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={formData.month}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    month: Number(e.target.value),
                  })
                }
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(0, m - 1).toLocaleString("default", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Day of Month
              </label>
              <Input
                type="number"
                min="1"
                max="31"
                value={String(formData.day)}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    day: Number(e.target.value),
                  })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Years to Generate
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={formData.years}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    years: Number(e.target.value),
                  })
                }
              >
                {[1, 2, 3, 5, 10].map((y) => (
                  <option key={y} value={y}>
                    {y} year{y > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPaid}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      isPaid: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Paid Holiday</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Create Recurring Holiday</Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
