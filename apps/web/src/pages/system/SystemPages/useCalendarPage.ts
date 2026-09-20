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
import { useToast } from "@/hooks/useToast";
import type { CalendarEvent } from "./SystemPages.types";

export interface CalendarFormData {
  date: string;
  name: string;
  type: "holiday" | "special" | "workday";
  isPaid: boolean;
}

export interface RecurringFormData {
  month: number;
  day: number;
  name: string;
  type: "holiday" | "special" | "workday";
  isPaid: boolean;
  years: number;
}

const EMPTY_FORM: CalendarFormData = {
  date: "",
  name: "",
  type: "holiday",
  isPaid: true,
};

const EMPTY_RECURRING: RecurringFormData = {
  month: 1,
  day: 1,
  name: "",
  type: "holiday",
  isPaid: true,
  years: 5,
};

export function useCalendarPage() {
  const { addToast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState<CalendarFormData>({ ...EMPTY_FORM });
  const [recurringFormData, setRecurringFormData] = useState<RecurringFormData>({
    ...EMPTY_RECURRING,
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
    fetchEvents();
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
      setFormData({ ...EMPTY_FORM });
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
      setRecurringFormData({ ...EMPTY_RECURRING });
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

  return {
    events,
    loading,
    showForm,
    showRecurringForm,
    editingId,
    selectedYear,
    formData,
    recurringFormData,
    groupedByMonth,
    setShowForm,
    setShowRecurringForm,
    setFormData,
    setRecurringFormData,
    setSelectedYear,
    setEditingId,
    fetchEvents,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleExport,
    handleCreateRecurringHoliday,
  };
}
