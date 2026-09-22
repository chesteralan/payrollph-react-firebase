export interface NameRecord {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  employeeCount?: number;
}

export interface CsvPreviewRow {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  isValid?: boolean;
  error?: string;
  errors?: string[];
}

export interface NamesListPageFormData {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
}

export interface NamesListPageFilters {
  search: string;
}
