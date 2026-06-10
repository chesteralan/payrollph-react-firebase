interface CalendarEvent {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
}

export function generateICS(events: CalendarEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PayrollPH//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const event of events) {
    const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@payrollph`;
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTART:${fmt(event.start)}`,
      `DTEND:${fmt(event.end)}`,
      `SUMMARY:${event.title}`,
    );
    if (event.description) lines.push(`DESCRIPTION:${event.description}`);
    if (event.location) lines.push(`LOCATION:${event.location}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(events: CalendarEvent[], filename = "calendar.ics") {
  const ics = generateICS(events);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
