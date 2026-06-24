import type { ReactNode } from "react";
import { DAY_NAMES } from "./constants";

export interface CalendarGridProps {
  year: number;
  month: number;
  firstDayOfMonth: number;
  daysInMonth: number;
  today?: Date;
  renderDay?: (day: number, isToday: boolean) => ReactNode;
  renderDayHeader?: (dayName: string) => ReactNode;
  className?: string;
}

/**
 * Shared calendar grid primitive.
 *
 * Renders a 7-column month grid with day-of-week headers, leading empty cells,
 * and a cell per day in the month. Each day cell is rendered via `renderDay`
 * so callers control content and styling.
 */
export function CalendarGrid({
  year,
  month,
  firstDayOfMonth: fdm,
  daysInMonth: dim,
  today,
  renderDay,
  renderDayHeader,
  className = "",
}: CalendarGridProps) {
  const defaultHeader = (name: string) => (
    <div
      key={name}
      className="text-center text-xs font-medium text-gray-500 py-2"
    >
      {name}
    </div>
  );

  const defaultDay = (day: number, isToday: boolean) => (
    <div
      key={day}
      className={`relative border rounded-lg p-2 text-left ${
        isToday ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <span className="text-sm font-medium">{day}</span>
    </div>
  );

  const resolvedToday =
    today ?? (year !== undefined ? new Date() : undefined);

  const renderDayFn = renderDay ?? defaultDay;
  const renderDayHeaderFn = renderDayHeader ?? defaultHeader;

  return (
    <div className={`grid grid-cols-7 gap-1 ${className}`}>
      {DAY_NAMES.map((d) => renderDayHeaderFn(d))}
      {Array.from({ length: fdm }, (_, i) => (
        <div key={`empty-${i}`} />
      ))}
      {Array.from({ length: dim }, (_, i) => i + 1).map((day) => {
        const isToday =
          resolvedToday !== undefined &&
          day === resolvedToday.getDate() &&
          month === resolvedToday.getMonth() &&
          year === resolvedToday.getFullYear();
        return renderDayFn(day, isToday);
      })}
    </div>
  );
}
