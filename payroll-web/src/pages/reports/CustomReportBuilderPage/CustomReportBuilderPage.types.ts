export interface ReportField {
  id: string;
  label: string;
  category: string;
  selected?: boolean;
  type: string;
  enabled?: boolean;
}

export interface ReportFilter {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "between";
  value: unknown;
}

export interface SavedReport {
  id: string;
  name: string;
  fields: string[];
  filters: ReportFilter[];
  groupBy?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomReportConfig {
  name: string;
  fields: string[];
  filters: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
