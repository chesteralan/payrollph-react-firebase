import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { CompanyColumnGroup } from "./CompaniesPage.types";
import type { CompanyFormData } from "./useCompanies";

interface CompanyFormProps {
  formData: CompanyFormData;
  columnGroup: CompanyColumnGroup;
  editingId: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onFormDataChange: (data: CompanyFormData) => void;
  onColumnGroupChange: (group: CompanyColumnGroup) => void;
  onAddPayrollPeriod: () => void;
  onRemovePayrollPeriod: (index: number) => void;
  onUpdatePayrollPeriod: (index: number, field: string, value: string | number | undefined) => void;
}

export function CompanyForm({
  formData,
  columnGroup,
  editingId,
  onSubmit,
  onCancel,
  onFormDataChange,
  onColumnGroupChange,
  onAddPayrollPeriod,
  onRemovePayrollPeriod,
  onUpdatePayrollPeriod,
}: CompanyFormProps) {
  const updateField = <K extends keyof CompanyFormData>(key: K, value: CompanyFormData[K]) => {
    onFormDataChange({ ...formData, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingId ? "Edit" : "Add"} Company</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="name"
              label="Company Name"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
            <Input
              id="tin"
              label="TIN"
              value={formData.tin}
              onChange={(e) => updateField("tin", e.target.value)}
            />
            <Input
              id="address"
              label="Address"
              value={formData.address}
              onChange={(e) => updateField("address", e.target.value)}
            />
            <Input
              id="defaultWorkdays"
              label="Default Workdays/Month"
              type="number"
              value={String(formData.defaultWorkdays)}
              onChange={(e) =>
                updateField("defaultWorkdays", Number(e.target.value))
              }
            />
            <Input
              id="printHeader"
              label="Print Header"
              value={formData.printHeader}
              onChange={(e) =>
                updateField("printHeader", e.target.value)
              }
              placeholder="Company header for prints"
            />
            <Input
              id="printFooter"
              label="Print Footer"
              value={formData.printFooter}
              onChange={(e) =>
                updateField("printFooter", e.target.value)
              }
              placeholder="Company footer for prints"
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">
                Payroll Periods
              </h3>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onAddPayrollPeriod}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Period
              </Button>
            </div>
            {formData.payrollPeriods.length === 0 ? (
              <p className="text-sm text-gray-500">
                No payroll periods configured. Click "Add Period" to configure.
              </p>
            ) : (
              <div className="space-y-3">
                {formData.payrollPeriods.map((period, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-gray-50 relative"
                  >
                    <button
                      type="button"
                      onClick={() => onRemovePayrollPeriod(index)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={period.type}
                          onChange={(e) =>
                            onUpdatePayrollPeriod(index, "type", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="semi-monthly">Semi-Monthly</option>
                          <option value="bi-weekly">Bi-Weekly</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Cutoff 1 (Day)
                        </label>
                        <Input
                          type="number"
                          value={String(period.cutOff1Day || "")}
                          onChange={(e) =>
                            onUpdatePayrollPeriod(
                              index,
                              "cutOff1Day",
                              e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            )
                          }
                          placeholder="e.g., 15"
                        />
                      </div>
                      {period.type === "semi-monthly" && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Cutoff 2 (Day)
                          </label>
                          <Input
                            type="number"
                            value={String(period.cutOff2Day || "")}
                            onChange={(e) =>
                              onUpdatePayrollPeriod(
                                index,
                                "cutOff2Day",
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                            placeholder="e.g., 30"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Pay Day
                        </label>
                        <Input
                          type="number"
                          value={String(period.payDay || "")}
                          onChange={(e) =>
                            onUpdatePayrollPeriod(
                              index,
                              "payDay",
                              e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            )
                          }
                          placeholder="e.g., 5"
                        />
                      </div>
                      {period.type === "weekly" || period.type === "bi-weekly" ? (
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Frequency
                          </label>
                          <Input
                            value={period.frequency || ""}
                            onChange={(e) =>
                              onUpdatePayrollPeriod(
                                index,
                                "frequency",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., Every Friday"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Column Groups
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Control which column groups are shown by default in payroll
              processing views.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(columnGroup).map(([key, value]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      onColumnGroupChange({
                        ...columnGroup,
                        [key]: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {key}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit">{editingId ? "Update" : "Create"}</Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
