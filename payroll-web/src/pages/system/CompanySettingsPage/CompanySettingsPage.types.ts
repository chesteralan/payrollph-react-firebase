export interface CompanySettings {
  id?: string;
  companyId: string;
  general: {
    defaultCurrency: string;
    fiscalYearStartMonth: number;
    taxYear: string;
  };
  payrollOptions: {
    autoApproveLeaves: boolean;
    requireDtrBeforePayroll: boolean;
    roundTimeEntries: "none" | "15min" | "30min";
  };
  displayOptions: {
    itemsPerPage: number;
    dateFormat: string;
    timeFormat: "12h" | "24h";
    theme: "light" | "dark" | "system";
  };
  notifications: {
    emailOnPayrollLock: boolean;
    emailOnLeaveApproval: boolean;
  };
}
