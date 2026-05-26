export interface NameRecord {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
}

export interface CsvPreviewRow {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  isValid: boolean;
  error?: string;
}
