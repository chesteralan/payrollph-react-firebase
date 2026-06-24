import {
  Calendar as CalendarIcon,
  Check,
  Plus,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CalendarGrid } from "@/components/ui/CalendarGrid";
import type { DTREntry, LeaveApplication, LeaveBalance } from "@/types/dtr";
import { dateStr, dayStatus } from "./DTRComputation";
import { DTRStatsCards } from "./DTRStatsCards";

const STATUS_COLORS: Record<string, string> = {
  complete: "bg-green-100 text-green-700 border-green-200",
  partial: "bg-yellow-100 text-yellow-700 border-yellow-200",
  absent: "bg-red-100 text-red-700 border-red-200",
  none: "bg-white text-gray-400 border-gray-200 hover:border-gray-300",
};

const LEAVE_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

interface DTRCalendarProps {
  stats: {
    daysWorked: number;
    totalHours: number;
    totalOvertime: number;
    totalLate: number;
    totalAbsences: number;
  };
  selectedYear: number;
  selectedMonth: number;
  daysInMonth: number;
  firstDayOfMonth: number;
  today: Date;
  entryMap: Map<string, DTREntry>;
  onDayClick: (day: number) => void;
  /** Leave data */
  leaveBalances: LeaveBalance[];
  leaveApplications: LeaveApplication[];
  benefits: { id: string; name: string }[];
  onApplyLeave: () => void;
  onApproveLeave: (app: LeaveApplication) => void;
  onRejectLeave: (app: LeaveApplication) => void;
  canEdit: boolean;
}

export function DTRCalendar({
  stats,
  selectedYear,
  selectedMonth,
  daysInMonth: dim,
  firstDayOfMonth: fdm,
  today,
  entryMap,
  onDayClick,
  leaveBalances,
  leaveApplications,
  benefits,
  onApplyLeave,
  onApproveLeave,
  onRejectLeave,
  canEdit: canEditPerm,
}: DTRCalendarProps) {
  return (
    <>
      <DTRStatsCards stats={stats} />

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          <CalendarGrid
            year={selectedYear}
            month={selectedMonth}
            firstDayOfMonth={fdm}
            daysInMonth={dim}
            today={today}
            renderDayHeader={(name) => (
              <div
                key={name}
                className="text-center text-xs font-medium text-gray-500 py-2"
              >
                {name}
              </div>
            )}
            renderDay={(day, isToday) => {
              const status = dayStatus(
                day,
                selectedYear,
                selectedMonth,
                entryMap,
              );
              const entry = entryMap.get(
                dateStr(selectedYear, selectedMonth, day),
              );
              return (
                <button
                  key={day}
                  onClick={() => onDayClick(day)}
                  className={`relative border rounded-lg p-2 text-left transition-colors ${STATUS_COLORS[status]} ${isToday ? "ring-2 ring-blue-500" : ""}`}
                >
                  <span className="text-sm font-medium">{day}</span>
                  {entry && (
                    <div className="mt-1">
                      {entry.timeIn && entry.timeOut && (
                        <span className="text-[10px] block">
                          {entry.timeIn}-{entry.timeOut}
                        </span>
                      )}
                      {entry.overtimeHours > 0 && (
                        <span className="text-[10px] block text-purple-600">
                          OT: {entry.overtimeHours}h
                        </span>
                      )}
                      {entry.absenceType && (
                        <span className="text-[10px] block capitalize">
                          {entry.absenceType}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            }}
          />
        </CardContent>
      </Card>

      {/* Leave Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Leave Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {canEditPerm && (
            <Button onClick={onApplyLeave} className="mb-4">
              <Plus className="w-4 h-4 mr-2" />
              Apply for Leave
            </Button>
          )}

          {leaveBalances.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Leave Balances</h4>
              <div className="flex flex-wrap gap-2">
                {leaveBalances.map((bal) => {
                  const benefitName =
                    benefits.find((b) => b.id === bal.benefitId)?.name ??
                    "Unknown";
                  return (
                    <span
                      key={bal.id}
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                    >
                      {benefitName}: {bal.remaining}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {leaveApplications.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">
                Leave Applications
              </h4>
              <div className="space-y-2">
                {leaveApplications.map((app) => {
                  const benefitName =
                    benefits.find((b) => b.id === app.benefitId)?.name ??
                    "Unknown";
                  return (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">{benefitName}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(app.startDate).toLocaleDateString()} -{" "}
                          {new Date(app.endDate).toLocaleDateString()}
                        </p>
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${LEAVE_STATUS_COLORS[app.status]}`}
                        >
                          {app.status}
                        </span>
                      </div>
                      {app.status === "pending" && canEditPerm && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onApproveLeave(app)}
                          >
                            <Check className="w-4 h-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRejectLeave(app)}
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
