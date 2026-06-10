import { describe, it, expect } from "vitest";
import { generateICS, downloadICS } from "./icsGenerator";

describe("generateICS", () => {
  it("should generate valid ICS content", () => {
    const events = [
      { title: "Test Event", start: new Date("2026-01-15"), end: new Date("2026-01-16") },
    ];
    const ics = generateICS(events);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("SUMMARY:Test Event");
  });

  it("should support multiple events", () => {
    const events = [
      { title: "Event A", start: new Date("2026-01-15"), end: new Date("2026-01-16") },
      { title: "Event B", start: new Date("2026-02-01"), end: new Date("2026-02-02") },
    ];
    const ics = generateICS(events);
    expect((ics.match(/BEGIN:VEVENT/g) || []).length).toBe(2);
  });
});
