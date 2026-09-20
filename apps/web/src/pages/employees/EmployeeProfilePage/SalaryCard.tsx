import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Save } from "lucide-react";
import type { EmployeeSalary } from "./EmployeeProfilePage.types";

interface SalaryForm {
  amount: string;
  frequency: "monthly" | "semi-monthly" | "weekly" | "daily";
  effectiveDate: string;
}

interface SalaryCardProps {
  salaryForm: SalaryForm;
  onSalaryFormChange: (form: SalaryForm) => void;
  salary: EmployeeSalary | null;
  onSaveSalary: () => void;
  saving: boolean;
  formatCurrency: (value: number) => string;
}

export function SalaryCard({
  salaryForm,
  onSalaryFormChange,
  salary,
  onSaveSalary,
  saving,
  formatCurrency,
}: SalaryCardProps) {
  const update = (partial: Partial<SalaryForm>) =>
    onSalaryFormChange({ ...salaryForm, ...partial });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Salary & Compensation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Current Salary
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <Input
              id="salaryAmount"
              label="Amount"
              type="number"
              value={salaryForm.amount}
              onChange={(e) => update({ amount: e.target.value })}
              placeholder="0.00"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={salaryForm.frequency}
                onChange={(e) =>
                  update({
                    frequency: e.target.value as
                      | "monthly"
                      | "semi-monthly"
                      | "weekly"
                      | "daily",
                  })
                }
              >
                <option value="monthly">Monthly</option>
                <option value="semi-monthly">Semi-monthly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
              </select>
            </div>
            <Input
              id="effectiveDate"
              label="Effective Date"
              type="date"
              value={salaryForm.effectiveDate}
              onChange={(e) => update({ effectiveDate: e.target.value })}
            />
          </div>
          {salary && (
            <div className="mt-4 text-sm text-gray-500">
              Effective: {new Date(salary.effectiveDate).toLocaleDateString()}
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button onClick={onSaveSalary} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Salary"}
            </Button>
          </div>
        </div>

        {salary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Monthly Rate</div>
              <div className="text-lg font-semibold">
                {formatCurrency(
                  salary.frequency === "monthly"
                    ? salary.amount
                    : salary.frequency === "semi-monthly"
                      ? salary.amount * 2
                      : salary.frequency === "weekly"
                        ? salary.amount * 4.33
                        : salary.amount * 22,
                )}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Daily Rate</div>
              <div className="text-lg font-semibold">
                {formatCurrency(
                  salary.frequency === "daily"
                    ? salary.amount
                    : salary.amount / 22,
                )}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Hourly Rate</div>
              <div className="text-lg font-semibold">
                {formatCurrency(
                  (salary.frequency === "daily"
                    ? salary.amount
                    : salary.amount / 22) / 8,
                )}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Pay Frequency</div>
              <div className="text-lg font-semibold capitalize">
                {salary.frequency}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
