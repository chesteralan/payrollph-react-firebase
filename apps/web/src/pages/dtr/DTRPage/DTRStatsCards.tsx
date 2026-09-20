import {
  AlertCircle,
  Calendar as CalendarIcon,
  Clock,
  Timer,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

interface DTRStatsCardsProps {
  stats: {
    daysWorked: number;
    totalHours: number;
    totalOvertime: number;
    totalLate: number;
    totalAbsences: number;
  };
}

export function DTRStatsCards({ stats }: DTRStatsCardsProps) {
  return (
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
  );
}
