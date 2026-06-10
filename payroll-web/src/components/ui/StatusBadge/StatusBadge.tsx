import { clsx } from "clsx";
import { AlertCircle, CheckCircle, Clock, XCircle, Lock, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type StatusType =
  | "draft"
  | "locked"
  | "published"
  | "active"
  | "inactive"
  | "terminated"
  | "pending"
  | "completed"
  | "failed"
  | "processing"
  | string;

interface StatusBadgeProps {
  status: StatusType;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<
  string,
  { bg: string; text: string; icon: LucideIcon; label: string }
> = {
  draft: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    icon: FileText,
    label: "Draft",
  },
  locked: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    icon: Lock,
    label: "Locked",
  },
  published: {
    bg: "bg-green-100",
    text: "text-green-800",
    icon: CheckCircle,
    label: "Published",
  },
  active: {
    bg: "bg-green-100",
    text: "text-green-800",
    icon: CheckCircle,
    label: "Active",
  },
  inactive: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    icon: XCircle,
    label: "Inactive",
  },
  terminated: {
    bg: "bg-red-100",
    text: "text-red-800",
    icon: XCircle,
    label: "Terminated",
  },
  pending: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    icon: Clock,
    label: "Pending",
  },
  completed: {
    bg: "bg-green-100",
    text: "text-green-800",
    icon: CheckCircle,
    label: "Completed",
  },
  failed: {
    bg: "bg-red-100",
    text: "text-red-800",
    icon: AlertCircle,
    label: "Failed",
  },
  processing: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    icon: Clock,
    label: "Processing",
  },
};

export function StatusBadge({
  status,
  size = "sm",
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    icon: AlertCircle,
    label: status,
  };
  const Icon = config.icon;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 font-medium rounded-full",
        config.bg,
        config.text,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className,
      )}
    >
      {showIcon && <Icon className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />}
      {config.label}
    </span>
  );
}
