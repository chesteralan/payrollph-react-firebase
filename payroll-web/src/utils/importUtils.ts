// -nocheck
export interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: ImportError[];
  stats: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
  };
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
}

export function parseCSV(text: string, delimiter?: string): string[][] {
  const delim = delimiter || detectDelimiter(text);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delim) {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
        if (char === "\r") i++;
      } else {
        currentField += char;
      }
    }
  }

  if (currentField !== "" || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  return rows;
}

function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0];
  const counts = { ",": 0, "\t": 0, ";": 0, "|": 0 };

  for (const char of firstLine) {
    if (char in counts) {
      counts[char as keyof typeof counts]++;
    }
  }

  const max = Math.max(...Object.values(counts));
  if (max === 0) return ",";

  for (const [delim, count] of Object.entries(counts)) {
    if (count === max) return delim;
  }

  return ",";
}

export function csvToObjects<T extends Record<string, string>>(
  text: string,
  headers?: string[],
): { headers: string[]; rows: T[]; errors: ImportError[] } {
  const rows = parseCSV(text);
  if (rows.length === 0) {
    return {
      headers: [],
      rows: [],
      errors: [{ row: 0, message: "Empty file" }],
    };
  }

  const fileHeaders = headers || rows[0];
  const dataStart = headers ? 0 : 1;
  const result: T[] = [];
  const errors: ImportError[] = [];

  for (let i = dataStart; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || (row.length === 1 && row[0] === "")) continue;

    const obj = {} as T;
    for (let j = 0; j < fileHeaders.length; j++) {
      const key = fileHeaders[j];
      obj[key] = row[j] || "";
    }
    result.push(obj);
  }

  return { headers: fileHeaders, rows: result, errors };
}

export function validateRequired<T extends Record<string, unknown>>(
  rows: T[],
  requiredFields: (keyof T)[],
  startRow?: number,
): ImportError[] {
  const errors: ImportError[] = [];
  const base = startRow || 1;

  rows.forEach((row, index) => {
    for (const field of requiredFields) {
      const value = row[field];
      if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
      ) {
        errors.push({
          row: base + index,
          field: String(field),
          message: `Required field "${String(field)}" is empty`,
        });
      }
    }
  });

  return errors;
}

export function findDuplicates<T extends Record<string, unknown>>(
  rows: T[],
  field: keyof T,
  startRow?: number,
): { duplicates: Set<number>; count: number } {
  const seen = new Map<string, number>();
  const duplicates = new Set<number>();
  const base = startRow || 1;

  rows.forEach((row, index) => {
    const value = String(row[field] || "")
      .trim()
      .toLowerCase();
    if (!value) return;

    if (seen.has(value)) {
      duplicates.add(base + index);
      if (!duplicates.has(seen.get(value)!)) {
        duplicates.add(seen.get(value)!);
      }
    } else {
      seen.set(value, base + index);
    }
  });

  return { duplicates, count: duplicates.size };
}
