import type { PrintFormat } from "./PrintFormatsPage.types";

export const WIZARD_STEPS = [
  "Basic Info",
  "Layout",
  "Header/Footer",
  "Columns",
  "Review",
] as const;

export const OUTPUT_TYPES: { value: string; label: string }[] = [
  { value: "register", label: "Payroll Register" },
  { value: "payslip", label: "Payslip" },
  { value: "transmittal", label: "Bank Transmittal" },
  { value: "journal", label: "Journal Entry" },
  { value: "denomination", label: "Cash Denomination" },
];

export const PAPER_SIZES = ["A4", "Letter", "Legal"] as const;

export const FONT_SIZES: { value: PrintFormat["fontSize"]; label: string }[] = [
  { value: "xs", label: "Extra Small" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

export const AVAILABLE_COLUMNS: { id: string; label: string }[] = [
  { id: "basic", label: "Basic Salary" },
  { id: "earnings", label: "Earnings" },
  { id: "gross", label: "Gross Pay" },
  { id: "deductions", label: "Deductions" },
  { id: "benefits", label: "Benefits (EE)" },
  { id: "net", label: "Net Pay" },
  { id: "daysWorked", label: "Days Worked" },
  { id: "absences", label: "Absences" },
  { id: "late", label: "Late Hours" },
  { id: "overtime", label: "Overtime Hours" },
];

export const DEFAULT_COLUMNS = [
  "basic",
  "earnings",
  "gross",
  "deductions",
  "benefits",
  "net",
];

export const DEFAULT_SIGNATURE_LABELS = [
  "Prepared by",
  "Checked by",
  "Approved by",
];
