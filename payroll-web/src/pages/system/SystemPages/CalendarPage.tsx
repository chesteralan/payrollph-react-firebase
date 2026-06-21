import { useCallback, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/useToast";
import {
  Calendar as CalendarIcon,
  Download,
  Edit,
  Plus,
  Repeat,
  Trash2,
} from "lucide-react";
import type { CalendarEvent } from "./SystemPages.types";
import { CALENDAR_TYPE_COLORS, MONTH_NAMES } from "./CalendarPage.constants";

export function CalendarPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions();
  const { addToast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    date: "",
    name: "",
    type: "holiday" as "holiday" | "special" | "workday",
    isPaid: true,
  });
  const [recurringFormData, setRecurringFormData] = useState({
    month: 1,
    day: 1,
    name: "",
    type: "holiday" as "holiday" | "special" | "workday",
    isPaid: true,
    years: 5,
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "calendar")));
      const allEvents = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as CalendarEvent[];
      setEvents(
        allEvents
          .filter((e) => {
            const d = new Date(e.date);
            return d.getFullYear() === selectedYear;
          })
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          ),
      );
    } catch {
      addToast({ type: "error", title: "Failed to load calendar events" });
    }
    setLoading(false);
  }, [selectedYear, addToast]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    fetchEvents();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [fetchEvents, selectedYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        date: new Date(formData.date),
        companyId: "global",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (editingId) {
        await updateDoc(doc(db, "calendar", editingId), data);
        addToast({
          type: "success",
          title: "Event updated",
          message: `${formData.name} has been updated`,
        });
      } else {
        await addDoc(collection(db, "calendar"), data);
        addToast({
          type: "success",
          title: "Event created",
          message: `${formData.name} has been added`,
        });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ date: "", name: "", type: "holiday", isPaid: true });
      fetchEvents();
    } catch {
      addToast({ type: "error", title: "Failed to save calendar event" });
    }
  };

  const handleEdit = (event: CalendarEvent) => {
    setEditingId(event.id);
    setFormData({
      date: new Date(event.date).toISOString().split("T")[0]!,
      name: event.name,
      type: event.type,
      isPaid: event.isPaid ?? true,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this calendar entry?")) {
      try {
        await deleteDoc(doc(db, "calendar", id));
        addToast({ type: "success", title: "Event deleted" });
        fetchEvents();
      } catch {
        addToast({ type: "error", title: "Failed to delete calendar event" });
      }
    }
  };

  const handleExport = () => {
    const headers = ["Date", "Name", "Type", "Paid"];
    const csvRows = [headers.join(",")];
    for (const event of events) {
      const date = new Date(event.date).toLocaleDateString();
      const name = `"${event.name}"`;
      const type = event.type;
      const paid = event.isPaid ? "Yes" : "No";
      csvRows.push([date, name, type, paid].join(","));
    }
    const csv = csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Calendar_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateRecurringHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { month, day, name, type, isPaid, years } = recurringFormData;
      const currentYear = new Date().getFullYear();
      const batch = writeBatch(db);

      for (let i = 0; i < years; i++) {
        const year = currentYear + i;
        const date = new Date(year, month - 1, day);
        const entryData = {
          date,
          name,
          type,
          isPaid,
          companyId: "global",
          recurring: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const newDocRef = doc(collection(db, "calendar"));
        batch.set(newDocRef, entryData);
      }

      await batch.commit();
      setShowRecurringForm(false);
      setRecurringFormData({
        month: 1,
        day: 1,
        name: "",
        type: "holiday",
        isPaid: true,
        years: 5,
      });
      addToast({
        type: "success",
        title: "Recurring holidays created",
        message: `Created ${years} years of "${name}"`,
      });
      fetchEvents();
    } catch {
      addToast({ type: "error", title: "Failed to create recurring holidays" });
    }
  };

  const groupedByMonth = events.reduce(
    (acc, event) => {
      const month = new Date(event.date).getMonth();
      if (!acc[month]) acc[month] = [];
      acc[month].push(event);
      return acc;
    },
    {} as Record<number, CalendarEvent[]>,
  );

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
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit" : "Add"} Calendar Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="date"
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
                <Input
                  id="name"
                  label="Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
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
                      setFormData({
                        ...formData,
                        type: e.target.value as
                          | "holiday"
                          | "special"
                          | "workday",
                      })
                    }
                  >
                    <option value="holiday">Regular Holiday</option>
                    <option value="special">Special Holiday</option>
                    <option value="workday">Special Workday</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isPaid}
                      onChange={(e) =>
                        setFormData({ ...formData, isPaid: e.target.checked })
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Paid Holiday</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingId ? "Update" : "Create"}</Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showRecurringForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              <CalendarIcon className="w-4 h-4 mr-2 inline" />
              Create Recurring Holiday
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRecurringHoliday} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="recurringName"
                  label="Holiday Name"
                  value={recurringFormData.name}
                  onChange={(e) =>
                    setRecurringFormData({
                      ...recurringFormData,
                      name: e.target.value,
                    })
                  }
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={recurringFormData.type}
                    onChange={(e) =>
                      setRecurringFormData({
                        ...recurringFormData,
                        type: e.target.value as
                          | "holiday"
                          | "special"
                          | "workday",
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
                    value={recurringFormData.month}
                    onChange={(e) =>
                      setRecurringFormData({
                        ...recurringFormData,
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
                    value={String(recurringFormData.day)}
                    onChange={(e) =>
                      setRecurringFormData({
                        ...recurringFormData,
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
                    value={recurringFormData.years}
                    onChange={(e) =>
                      setRecurringFormData({
                        ...recurringFormData,
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
                      checked={recurringFormData.isPaid}
                      onChange={(e) =>
                        setRecurringFormData({
                          ...recurringFormData,
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
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowRecurringForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : events.length === 0 ? (
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
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-2 border border-gray-100 rounded"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {new Date(event.date).getDate()}
                          </span>
                          <span className="text-sm">{event.name}</span>
                          {event.recurring && (
                            <Repeat className="w-3 h-3 text-blue-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${CALENDAR_TYPE_COLORS[event.type]}`}
                          >
                            {event.type}
                          </span>
                          {event.isPaid && (
                            <span className="text-xs text-gray-500">Paid</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {canEdit("system", "calendar") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(event)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                        {canDelete("system", "calendar") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(event.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
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
