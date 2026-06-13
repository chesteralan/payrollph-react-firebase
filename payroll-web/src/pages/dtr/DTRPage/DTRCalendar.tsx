import {
  AlertCircle,
  Calendar as CalendarIcon,
  Check,
  Clock,
  Plus,
  Timer,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { DTREntry, LeaveApplication, LeaveBalance } from "@/types/dtr";
import { dateStr, dayStatus } from "./DTRComputation";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Days Worked</p>
                <p className="text-xl font-bold">{stats.daysWorked}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">Total Hours</p>
                <p className="text-xl font-bold">{stats.totalHours}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Timer className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-xs text-gray-500">Overtime</p>
                <p className="text-xl font-bold">{stats.totalOvertime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Late Hours</p>
                <p className="text-xl font-bold">{stats.totalLate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <X className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-xs text-gray-500">Absences</p>
                <p className="text-xl font-bold">{stats.totalAbsences}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-gray-500 py-2"
              >
                {d}
              </div>
            ))}
            {Array.from({ length: fdm }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: dim }, (_, i) => i + 1).map((day) => {
              const status = dayStatus(
                day,
                selectedYear,
                selectedMonth,
                entryMap,
              );
              const entry = entryMap.get(
                dateStr(selectedYear, selectedMonth, day),
              );
              const isToday =
                day === today.getDate() &&
                selectedMonth === today.getMonth() &&
                selectedYear === today.getFullYear();
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
            })}
          </div>
        </CardContent>
      </Card>

      {/* Leave Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Leave Management</CardTitle>
            <Button size="sm" onClick={onApplyLeave}>
              <Plus className="w-4 h-4 mr-2" />
              Apply Leave
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Leave Balances ({selectedYear})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {leaveBalances.length === 0 && (
                  <p className="text-sm text-gray-500 col-span-4">
                    No leave benefits configured
                  </p>
                )}
                {leaveBalances.map((bal) => {
                  const benefit = benefits.find((b) => b.id === bal.benefitId);
                  return (
                    <div key={bal.id} className="p-3 border rounded-lg">
                      <p className="text-sm font-medium">
                        {benefit?.name || "Leave"}
                      </p>
                      <div className="flex justify-between mt-2 text-xs">
                        <span className="text-gray-500">
                          Allowance: {bal.totalAllowance}
                        </span>
                        <span className="text-gray-500">Used: {bal.used}</span>
                      </div>
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${bal.totalAllowance > 0 ? (bal.used / bal.totalAllowance) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-right mt-1 font-medium">
                        {bal.remaining} remaining
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Leave Applications
              </h3>
              <div className="space-y-2">
                {leaveApplications.length === 0 && (
                  <p className="text-sm text-gray-500">No leave applications</p>
                )}
                {leaveApplications
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime(),
                  )
                  .map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${LEAVE_STATUS_COLORS[app.status]}`}
                          >
                            {app.status}
                          </span>
                          <span className="text-sm font-medium">
                            {benefits.find((b) => b.id === app.benefitId)
                              ?.name || "Leave"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {app.startDate} to {app.endDate} ({app.days} days)
                        </p>
                        {app.reason && (
                          <p className="text-xs text-gray-500">{app.reason}</p>
                        )}
                      </div>
                      {canEditPerm && app.status === "pending" && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onApproveLeave(app)}
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRejectLeave(app)}
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
