export interface SystemSettings {
  systemName: string;
  timezone: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  passwordRequireSpecialChars: boolean;
  dataRetentionMonths: number;
  autoCleanup: boolean;
  defaultTheme: "light" | "dark" | "system";
  logoUrl: string;
}
