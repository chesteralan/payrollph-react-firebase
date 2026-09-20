import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { Employee, SelectOption } from "./EmployeeProfilePage.types";

interface EmploymentDetailsProps {
  employee: Employee;
  groups: SelectOption[];
  positions: SelectOption[];
  areas: SelectOption[];
  onUpdateEmployee: (field: string, value: string) => void;
}

export function EmploymentDetails({
  employee,
  groups,
  positions,
  areas,
  onUpdateEmployee,
}: EmploymentDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employment Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={employee.groupId || ""}
              onChange={(e) => onUpdateEmployee("groupId", e.target.value)}
            >
              <option value="">Select Group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={employee.positionId || ""}
              onChange={(e) => onUpdateEmployee("positionId", e.target.value)}
            >
              <option value="">Select Position</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Area
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={employee.areaId || ""}
              onChange={(e) => onUpdateEmployee("areaId", e.target.value)}
            >
              <option value="">Select Area</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
              value={employee.statusId}
              readOnly
            />
          </div>
          <Input
            id="hireDate"
            label="Hire Date"
            type="date"
            value={
              employee.hireDate
                ? new Date(employee.hireDate).toISOString().split("T")[0]
                : ""
            }
            onChange={(e) => onUpdateEmployee("hireDate", e.target.value)}
          />
          <Input
            id="regularizationDate"
            label="Regularization Date"
            type="date"
            value={
              employee.regularizationDate
                ? new Date(employee.regularizationDate)
                    .toISOString()
                    .split("T")[0]
                : ""
            }
            onChange={(e) =>
              onUpdateEmployee("regularizationDate", e.target.value)
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
