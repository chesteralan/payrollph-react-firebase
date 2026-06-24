import { Repeat, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { CalendarEvent } from "./SystemPages.types";
import { CALENDAR_TYPE_COLORS } from "./CalendarPage.constants";

interface CalendarEventCardProps {
  event: CalendarEvent;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
}

export function CalendarEventCard({
  event,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: CalendarEventCardProps) {
  return (
    <div className="flex items-center justify-between p-2 border border-gray-100 rounded">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {new Date(event.date).getDate()}
          </span>
          <span className="text-sm">{event.name}</span>
          {event.recurring && (
            <Repeat className="w-3 h-3 text-blue-500" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${CALENDAR_TYPE_COLORS[event.type]}`}
          >
            {event.type}
          </span>
          {event.isPaid && (
            <span className="text-xs text-gray-500">Paid</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {canEdit && (
          <Button variant="ghost" size="sm" onClick={() => onEdit(event)}>
            <Edit className="w-3 h-3" />
          </Button>
        )}
        {canDelete && (
          <Button variant="ghost" size="sm" onClick={() => onDelete(event.id)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
