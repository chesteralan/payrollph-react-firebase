export interface ReportField {
  id: string;
  label: string;
  category: "employee" | "payroll" | "earnings" | "deductions" | "benefits";
  type: "string" | "number" | "date";
  enabled: boolean;
}

export interface ReportFilter {
  field: string;
  operator: "equals" | "contains" | "greater_than" | "less_than" | "between";
  value: string;
  value2?: string;
}

export interface SavedReport {
  id: string;
  name: string;
  description?: string;
  fields: string[];
  filters: ReportFilter[];
  groupBy?: string;
  sortBy?: string;
  sortDirection: "asc" | "desc";
  createdAt: Date;
}
