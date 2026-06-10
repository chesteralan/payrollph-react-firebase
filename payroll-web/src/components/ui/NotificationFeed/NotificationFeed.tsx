import { clsx } from "clsx";
import { Bell, X, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react";

interface Notification {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationFeedProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onClear: (id: string) => void;
  onClearAll: () => void;
  className?: string;
}

const typeStyles = {
  success: "bg-green-50 border-green-200",
  warning: "bg-yellow-50 border-yellow-200",
  error: "bg-red-50 border-red-200",
  info: "bg-blue-50 border-blue-200",
};

const typeIcons = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

export function NotificationFeed({
  notifications,
  onMarkRead,
  onClear,
  onClearAll,
  className,
}: NotificationFeedProps) {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className={clsx("space-y-2", className)}>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Notifications</span>
          {unread > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold text-white bg-primary-600 rounded-full min-w-[18px] h-[18px]">
              {unread}
            </span>
          )}
        </div>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {notifications.map((n) => {
          const Icon = typeIcons[n.type];
          return (
            <div
              key={n.id}
              className={clsx(
                "relative flex items-start gap-2 p-3 rounded-lg border text-sm transition-colors",
                typeStyles[n.type],
                !n.read && "ring-1 ring-primary-200",
              )}
              onClick={() => onMarkRead(n.id)}
            >
              <Icon className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{n.title}</p>
                <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {n.timestamp.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear(n.id);
                }}
                className="p-0.5 rounded hover:bg-black/5"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          );
        })}
        {notifications.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">
            No notifications
          </p>
        )}
      </div>
    </div>
  );
}
