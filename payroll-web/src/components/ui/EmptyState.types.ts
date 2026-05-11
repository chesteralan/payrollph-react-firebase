import { ReactNode } from "react";

export interface EmptyStateProps {
  icon?: ReactNode;
  type?:
    | "data"
    | "employees"
    | "payroll"
    | "calendar"
    | "reports"
    | "settings"
    | "files"
    | "error";
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}
