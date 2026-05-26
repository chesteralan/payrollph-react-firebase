import { ChevronLeft, ChevronRight, Filter, Calendar, Table } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import type { DTRPageViewMode } from './DTRPage.types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface EmployeeSelectorProps {
  employees: { id: string; name?: string; employeeCode: string }[];
  selectedEmployeeId: string;
  onEmployeeChange: (id: string) => void;
  selectedMonth: number;
  selectedYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onYearChange: (year: number) => void;
  viewMode: DTRPageViewMode;
  onViewModeChange: (mode: DTRPageViewMode) => void;
}

export function EmployeeSelector({
  employees,
  selectedEmployeeId,
  onEmployeeChange,
  selectedMonth,
  selectedYear,
  onPrevMonth,
  onNextMonth,
  onYearChange,
  viewMode,
  onViewModeChange,
}: EmployeeSelectorProps) {
  const today = new Date();

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={selectedEmployeeId}
              onChange={(e) => onEmployeeChange(e.target.value)}
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onPrevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-35 text-center">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </span>
            <Button variant="ghost" size="sm" onClick={onNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
          >
            {Array.from(
              { length: 5 },
              (_, i) => today.getFullYear() - 2 + i,
            ).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <div className="flex border rounded-md overflow-hidden">
            <button
              onClick={() => onViewModeChange('calendar')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1 ${viewMode === 'calendar' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}
            >
              <Calendar className="w-3 h-3" />
              Calendar
            </button>
            <button
              onClick={() => onViewModeChange('summary')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1 ${viewMode === 'summary' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}
            >
              <Table className="w-3 h-3" />
              Summary
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
