export interface Payroll {
  id: string;
  companyId: string;
  name: string;
  month: number;
  year: number;
  status: "draft" | "locked" | "published";
  isActive: boolean;
  isLocked: boolean;
  printFormat?: string;
  groupBy?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
