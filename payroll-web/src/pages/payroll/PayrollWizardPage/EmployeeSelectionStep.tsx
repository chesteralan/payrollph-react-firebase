import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';

interface EmployeeSelectionStepProps {
  employees: { id: string; nameId: string; employeeCode: string }[];
  selectedEmployeeIds: string[];
  onToggleEmployee: (empId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function EmployeeSelectionStep({
  employees,
  selectedEmployeeIds,
  onToggleEmployee,
  onNext,
  onBack,
}: EmployeeSelectionStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Employees</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {employees.map((emp) => (
            <label
              key={emp.id}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-md cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedEmployeeIds.includes(emp.id)}
                onChange={() => onToggleEmployee(emp.id)}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium">
                {emp.employeeCode}
              </span>
              <span className="text-sm text-gray-500">{emp.nameId}</span>
            </label>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Next</Button>
      </CardFooter>
    </Card>
  );
}
