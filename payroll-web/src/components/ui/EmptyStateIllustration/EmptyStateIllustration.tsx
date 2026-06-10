import { type ReactNode } from "react";
import { clsx } from "clsx";
import { Inbox, SearchX, FileText } from "lucide-react";

interface EmptyStateIllustrationProps {
  icon?: "inbox" | "search" | "file";
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

const icons = {
  inbox: Inbox,
  search: SearchX,
  file: FileText,
};

const iconColors = {
  inbox: "text-blue-500 bg-blue-50",
  search: "text-yellow-500 bg-yellow-50",
  file: "text-gray-500 bg-gray-50",
};

export function EmptyStateIllustration({
  icon = "inbox",
  title,
  description,
  action,
  className,
}: EmptyStateIllustrationProps) {
  const Icon = icons[icon];

  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center py-12 px-4",
        className,
      )}
    >
      <div
        className={clsx(
          "p-4 rounded-full mb-4",
          iconColors[icon],
        )}
      >
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-xs mb-4">
        {description}
      </p>
      {action}
    </div>
  );
}
