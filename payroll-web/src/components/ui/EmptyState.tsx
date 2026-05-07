import { ReactNode } from "react";
import {
  FileText,
  Users,
  DollarSign,
  Calendar,
  BarChart3,
  Settings,
  FolderOpen,
  AlertCircle,
} from "lucide-react";

interface EmptyStateProps {
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

const iconMap = {
  data: <FileText className="w-12 h-12 text-gray-300" />,
  employees: <Users className="w-12 h-12 text-gray-300" />,
  payroll: <DollarSign className="w-12 h-12 text-gray-300" />,
  calendar: <Calendar className="w-12 h-12 text-gray-300" />,
  reports: <BarChart3 className="w-12 h-12 text-gray-300" />,
  settings: <Settings className="w-12 h-12 text-gray-300" />,
  files: <FolderOpen className="w-12 h-12 text-gray-300" />,
  error: <AlertCircle className="w-12 h-12 text-gray-300" />,
};

export function EmptyState({
  icon,
  type,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  const displayIcon = icon || (type ? iconMap[type] : iconMap.data);

  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
      role="status"
    >
      <div className="mb-4" aria-hidden="true">
        {displayIcon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
