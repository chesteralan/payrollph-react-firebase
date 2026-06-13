import { useCallback, useState } from "react";

export type DateFormat =
  | "MM/DD/YYYY"
  | "DD/MM/YYYY"
  | "YYYY-MM-DD"
  | "DD-MMM-YYYY"
  | "MMM DD, YYYY";
export type TimeFormat = "12h" | "24h";

interface DateTimeFormatConfig {
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  locale?: string;
}

const defaultConfig: DateTimeFormatConfig = {
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  locale: "en-US",
};

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function padZero(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Format a date value into the specified string format.
 *
 * @param date - A Date object, ISO string, or timestamp (milliseconds)
 * @param format - The target date format (e.g. "MM/DD/YYYY", "DD-MMM-YYYY")
 * @param locale - The locale string for fallback formatting (default: "en-US")
 * @returns The formatted date string, or "Invalid Date" if the input cannot be parsed
 *
 * @example
 * ```ts
 * formatDate(new Date(), "MMM DD, YYYY"); // "Jan 15, 2026"
 * formatDate("2026-06-11", "DD/MM/YYYY"); // "11/06/2026"
 * ```
 */
export function formatDate(
  date: Date | string | number,
  format: DateFormat,
  locale = "en-US",
): string {
  const d =
    typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;
  if (isNaN(d.getTime())) return "Invalid Date";

  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();
  const monthName = monthNames[d.getMonth()];

  switch (format) {
    case "MM/DD/YYYY":
      return `${padZero(month)}/${padZero(day)}/${year}`;
    case "DD/MM/YYYY":
      return `${padZero(day)}/${padZero(month)}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${padZero(month)}-${padZero(day)}`;
    case "DD-MMM-YYYY":
      return `${padZero(day)}-${monthName}-${year}`;
    case "MMM DD, YYYY":
      return `${monthName} ${day}, ${year}`;
    default:
      return d.toLocaleDateString(locale);
  }
}

/**
 * Format a date value's time portion into a string.
 *
 * @param date - A Date object, ISO string, or timestamp (milliseconds)
 * @param format - The time format: "12h" (e.g. "2:30 PM") or "24h" (e.g. "14:30")
 * @returns The formatted time string, or "Invalid Time" if the input cannot be parsed
 *
 * @example
 * ```ts
 * formatTime(new Date(), "12h"); // "2:30 PM"
 * formatTime("2026-06-11T14:30:00", "24h"); // "14:30"
 * ```
 */
export function formatTime(
  date: Date | string | number,
  format: TimeFormat,
): string {
  const d =
    typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;
  if (isNaN(d.getTime())) return "Invalid Time";

  if (format === "24h") {
    return `${padZero(d.getHours())}:${padZero(d.getMinutes())}`;
  }

  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `${h}:${padZero(minutes)} ${ampm}`;
}

/**
 * Format a date value as a combined date + time string using the provided config.
 *
 * @param date - A Date object, ISO string, or timestamp (milliseconds)
 * @param config - Configuration object with `dateFormat`, `timeFormat`, and optional `locale`
 * @returns The formatted date-time string (e.g. "01/15/2026 2:30 PM")
 */
export function formatDateTime(
  date: Date | string | number,
  config: DateTimeFormatConfig,
): string {
  const dateStr = formatDate(date, config.dateFormat, config.locale);
  const timeStr = formatTime(date, config.timeFormat);
  return `${dateStr} ${timeStr}`;
}

/**
 * Format a date range as "start - end" string using the provided config.
 *
 * @param start - The start date (Date, ISO string, or timestamp)
 * @param end - The end date (Date, ISO string, or timestamp)
 * @param config - Configuration object with `dateFormat`, `timeFormat`, and optional `locale`
 * @returns The formatted date range string (e.g. "01/01/2026 - 01/31/2026")
 */
export function formatDateRange(
  start: Date | string | number,
  end: Date | string | number,
  config: DateTimeFormatConfig,
): string {
  const startStr = formatDate(start, config.dateFormat, config.locale);
  const endStr = formatDate(end, config.dateFormat, config.locale);
  return `${startStr} - ${endStr}`;
}

/**
 * Parse a date string according to the specified format and return a Date object.
 * Returns `null` if the input cannot be parsed or is invalid.
 *
 * @param input - The date string to parse (e.g. "01/15/2026", "15-Jan-2026")
 * @param format - The expected format of the input string
 * @returns A JavaScript Date object, or `null` if parsing fails
 *
 * @example
 * ```ts
 * parseDate("06/11/2026", "MM/DD/YYYY"); // Date(2026, 5, 11)
 * parseDate("15-Jan-2026", "DD-MMM-YYYY"); // Date(2026, 0, 15)
 * ```
 */
export function parseDate(input: string, format: DateFormat): Date | null {
  const cleaned = input.trim();
  if (!cleaned) return null;

  let month: number, day: number, year: number;

  try {
    switch (format) {
      case "MM/DD/YYYY": {
        const parts = cleaned.split("/");
        if (parts.length !== 3) return null;
        month = parseInt(parts[0]!, 10) - 1;
        day = parseInt(parts[1]!, 10);
        year = parseInt(parts[2]!, 10);
        break;
      }
      case "DD/MM/YYYY": {
        const parts = cleaned.split("/");
        if (parts.length !== 3) return null;
        day = parseInt(parts[0]!, 10);
        month = parseInt(parts[1]!, 10) - 1;
        year = parseInt(parts[2]!, 10);
        break;
      }
      case "YYYY-MM-DD": {
        const parts = cleaned.split("-");
        if (parts.length !== 3) return null;
        year = parseInt(parts[0]!, 10);
        month = parseInt(parts[1]!, 10) - 1;
        day = parseInt(parts[2]!, 10);
        break;
      }
      case "DD-MMM-YYYY": {
        const parts = cleaned.split("-");
        if (parts.length !== 3) return null;
        day = parseInt(parts[0]!, 10);
        month = monthNames.indexOf(parts[1]!);
        year = parseInt(parts[2]!, 10);
        break;
      }
      case "MMM DD, YYYY": {
        const match = cleaned.match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/);
        if (!match) return null;
        month = monthNames.indexOf(match[1]!);
        day = parseInt(match[2]!, 10);
        year = parseInt(match[3]!, 10);
        break;
      }
      default:
        return null;
    }

    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

/**
 * Hook that provides memoized date/time formatting functions based on a configurable format.
 * Allows runtime switching between date/time formats without recreating formatting functions.
 *
 * @param initialConfig - Optional partial config to override defaults
 *   (`{ dateFormat: "MM/DD/YYYY", timeFormat: "12h", locale: "en-US" }`)
 * @returns An object containing:
 *  - `config`: The current format configuration
 *  - `format(date)`: Format a date value according to the current config
 *  - `formatTime(date)`: Format the time portion according to the current config
 *  - `formatDateTime(date)`: Format both date and time
 *  - `updateConfig(newConfig)`: Update the configuration at runtime
 *
 * @example
 * ```tsx
 * const { format, updateConfig, config } = useDateTimeFormat({ dateFormat: "DD-MMM-YYYY" });
 * return (
 *   <>
 *     <span>{format(order.createdAt)}</span>
 *     <select onChange={e => updateConfig({ dateFormat: e.target.value })}>
 *       <option value="MM/DD/YYYY">US</option>
 *       <option value="DD/MM/YYYY">EU</option>
 *     </select>
 *   </>
 * );
 * ```
 */
export function useDateTimeFormat(
  initialConfig?: Partial<DateTimeFormatConfig>,
) {
  const [config, setConfig] = useState<DateTimeFormatConfig>({
    ...defaultConfig,
    ...initialConfig,
  });

  const format = useCallback(
    (date: Date | string | number) =>
      formatDate(date, config.dateFormat, config.locale),
    [config.dateFormat, config.locale],
  );

  const formatTime = useCallback(
    (date: Date | string | number) => {
      const d =
        typeof date === "string" || typeof date === "number"
          ? new Date(date)
          : date;
      return _formatTime(d, config.timeFormat);
    },
    [config.timeFormat],
  );

  const formatDateTime = useCallback(
    (date: Date | string | number) => {
      const d =
        typeof date === "string" || typeof date === "number"
          ? new Date(date)
          : date;
      return _formatDateTime(d, config);
    },
    [config],
  );

  const updateConfig = useCallback(
    (newConfig: Partial<DateTimeFormatConfig>) => {
      setConfig((prev) => ({ ...prev, ...newConfig }));
    },
    [],
  );

  return {
    config,
    format,
    formatTime,
    formatDateTime,
    updateConfig,
  };
}

function _formatTime(date: Date, format: TimeFormat): string {
  if (format === "24h") {
    return `${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
  }
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `${h}:${padZero(minutes)} ${ampm}`;
}

function _formatDateTime(date: Date, config: DateTimeFormatConfig): string {
  const dateStr = formatDate(date, config.dateFormat, config.locale);
  const timeStr = _formatTime(date, config.timeFormat);
  return `${dateStr} ${timeStr}`;
}
