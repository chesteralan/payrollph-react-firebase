import type { ReactNode } from "react";

export type EmptyStateType = 
  | "data" 
  | "employees" 
  | "payroll" 
  | "calendar" 
  | "reports" 
  | "settings" 
  | "files" 
  | "error";

export interface EmptyStateProps {
  icon?: ReactNode;
  type?: EmptyStateType;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}
