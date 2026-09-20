import { Download, Plus, Repeat } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { usePermissions } from "@/hooks/usePermissions";
import { useCalendarPage } from "./useCalendarPage";
import { CalendarEventForm } from "./CalendarEventForm";
import { RecurringHolidayForm } from "./RecurringHolidayForm";
import { CalendarEventCard } from "./CalendarEventCard";
import { MONTH_NAMES } from "@/utils/calendarUtils";

export function CalendarPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions();
  const {
    loading,
    showForm,
    showRecurringForm,
    selectedYear,
    formData,
    recurringFormData,
    groupedByMonth,
    setShowForm,
    setShowRecurringForm,
    setFormData,
    setRecurringFormData,
    setSelectedYear,
    editingId,
    setEditingId,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleExport,
    handleCreateRecurringHoliday,
  } = useCalendarPage();

  if (!canView("system", "calendar"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">System Calendar</h1>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {Array.from(
              { length: 5 },
              (_, i) => new Date().getFullYear() - 2 + i,
            ).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          {canAdd("system", "calendar") && (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowRecurringForm(!showRecurringForm)}
              >
                <Repeat className="w-4 h-4 mr-2" />
                Recurring Holiday
              </Button>
              <Button onClick={() => setShowForm(!showForm)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Date
              </Button>
            </>
          )}
        </div>
      </div>

      {showForm && (
        <CalendarEventForm
          formData={formData}
          editingId={editingId}
          onFormDataChange={setFormData}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        />
      )}

      {showRecurringForm && (
        <RecurringHolidayForm
          formData={recurringFormData}
          onFormDataChange={setRecurringFormData}
          onSubmit={handleCreateRecurringHoliday}
          onCancel={() => setShowRecurringForm(false)}
        />
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : Object.keys(groupedByMonth).length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500 py-8">
              No calendar entries for {selectedYear}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MONTH_NAMES.map((month, index) => {
            const monthEvents = groupedByMonth[index] || [];
            if (monthEvents.length === 0) return null;
            return (
              <Card key={index}>
                <CardHeader className="py-3">
                  <CardTitle className="text-lg">{month}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {monthEvents.map((event) => (
                    <CalendarEventCard
                      key={event.id}
                      event={event}
                      canEdit={canEdit("system", "calendar")}
                      canDelete={canDelete("system", "calendar")}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
