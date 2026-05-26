import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { usePermissions } from "@/hooks/usePermissions";
import { useTableSort } from "@/hooks/useTableSort";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Plus,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
} from "lucide-react";
import {
  exportToXLS,
  exportToCSV,
  benefitExportColumns,
} from "@/utils/exportUtils";
import type { BenefitItem } from "./ListPages.types";

export function BenefitsPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions();
  const [items, setItems] = useState<BenefitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    allocationType: "fixed" as
      | "fixed"
      | "percentage_of_salary"
      | "percentage_of_basic"
      | "tiered",
    allocationValue: 0,
    employeeShareType: "fixed" as "fixed" | "percentage",
    employeeShareValue: 0,
    employerShareType: "fixed" as "fixed" | "percentage",
    employerShareValue: 0,
  });

  const fetchItems = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "benefits"));
    setItems(
      snap.docs.map((d) => ({ id: d.id, ...d.data() })) as BenefitItem[],
    );
    setLoading(false);
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      description: formData.description,
      allocationType: formData.allocationType,
      allocationValue: ["percentage_of_salary", "percentage_of_basic"].includes(
        formData.allocationType,
      )
        ? formData.allocationValue
        : undefined,
      employeeShareType: formData.employeeShareType,
      employeeShareValue:
        formData.employeeShareType === "percentage"
          ? formData.employeeShareValue
          : undefined,
      employerShareType: formData.employerShareType,
      employerShareValue:
        formData.employerShareType === "percentage"
          ? formData.employerShareValue
          : undefined,
      isActive: true,
    };
    if (editingId) {
      await updateDoc(doc(db, "benefits", editingId), data);
    } else {
      await addDoc(collection(db, "benefits"), data);
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      allocationType: "fixed",
      allocationValue: 0,
      employeeShareType: "fixed",
      employeeShareValue: 0,
      employerShareType: "fixed",
      employerShareValue: 0,
    });
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this benefit?")) {
      await deleteDoc(doc(db, "benefits", id));
      fetchItems();
    }
  };

  const handleToggleStatus = async (item: BenefitItem) => {
    await updateDoc(doc(db, "benefits", item.id), { isActive: !item.isActive });
    fetchItems();
  };

  const getAllocationBadge = (item: BenefitItem) => {
    switch (item.allocationType) {
      case "fixed":
        return { label: "Fixed", color: "bg-gray-100 text-gray-800" };
      case "percentage_of_salary":
        return {
          label: `${item.allocationValue}% of Salary`,
          color: "bg-blue-100 text-blue-800",
        };
      case "percentage_of_basic":
        return {
          label: `${item.allocationValue}% of Basic`,
          color: "bg-green-100 text-green-800",
        };
      case "tiered":
        return { label: "Tiered", color: "bg-purple-100 text-purple-800" };
      default:
        return { label: "Unknown", color: "bg-gray-100 text-gray-800" };
    }
  };

  const getShareLabel = (type: "fixed" | "percentage", value?: number) => {
    return type === "percentage" ? `${value}%` : "Fixed";
  };

  const {
    items: sortedItems,
    handleSort,
    sortConfig,
  } = useTableSort(items, "name");

  const handleExportXLS = () => {
    const data = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || "",
      allocationType: item.allocationType,
      allocationValue: item.allocationValue || 0,
      employeeShareType: item.employeeShareType,
      employeeShareValue: item.employeeShareValue || 0,
      employerShareType: item.employerShareType,
      employerShareValue: item.employerShareValue || 0,
      isActive: item.isActive,
    }));
    exportToXLS(data, {
      filename: "Benefits",
      columns: benefitExportColumns,
      sheetName: "Benefits",
    });
  };

  const handleExportCSV = () => {
    const data = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || "",
      allocationType: item.allocationType,
      isActive: item.isActive,
    }));
    exportToCSV(data, benefitExportColumns, "Benefits");
  };

  if (!canView("lists", "benefits"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Benefits</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportXLS}>
            <Download className="w-4 h-4 mr-2" />
            XLS
          </Button>
          {canAdd("lists", "benefits") && (
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Benefit
            </Button>
          )}
        </div>
      </div>
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit" : "Add"} Benefit</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="name"
                  label="Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Allocation Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={formData.allocationType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        allocationType: e.target
                          .value as BenefitItem["allocationType"],
                      })
                    }
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage_of_salary">% of Salary</option>
                    <option value="percentage_of_basic">% of Basic Pay</option>
                    <option value="tiered">Tiered</option>
                  </select>
                </div>
                <Input
                  id="description"
                  label="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
                {["percentage_of_salary", "percentage_of_basic"].includes(
                  formData.allocationType,
                ) && (
                  <Input
                    id="allocationValue"
                    label={
                      formData.allocationType === "percentage_of_salary"
                        ? "Percentage of Salary (%)"
                        : "Percentage of Basic (%)"
                    }
                    type="number"
                    value={String(formData.allocationValue)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        allocationValue: Number(e.target.value),
                      })
                    }
                  />
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Share
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={formData.employeeShareType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          employeeShareType: e.target.value as
                            | "fixed"
                            | "percentage",
                        })
                      }
                    >
                      <option value="fixed">Fixed</option>
                      <option value="percentage">%</option>
                    </select>
                    {formData.employeeShareType === "percentage" && (
                      <Input
                        type="number"
                        value={String(formData.employeeShareValue)}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            employeeShareValue: Number(e.target.value),
                          })
                        }
                        className="w-24"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employer Share
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={formData.employerShareType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          employerShareType: e.target.value as
                            | "fixed"
                            | "percentage",
                        })
                      }
                    >
                      <option value="fixed">Fixed</option>
                      <option value="percentage">%</option>
                    </select>
                    {formData.employerShareType === "percentage" && (
                      <Input
                        type="number"
                        value={String(formData.employerShareValue)}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            employerShareValue: Number(e.target.value),
                          })
                        }
                        className="w-24"
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingId ? "Update" : "Create"}</Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Name
                    {sortConfig?.key === "name" ? (
                      sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )
                    ) : (
                      <ChevronsUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Allocation
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Employee
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Employer
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : sortedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No benefits found
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => {
                  const badge = getAllocationBadge(item);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.description || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {getShareLabel(
                          item.employeeShareType,
                          item.employeeShareValue,
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {getShareLabel(
                          item.employerShareType,
                          item.employerShareValue,
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full transition-colors ${item.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit("lists", "benefits") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingId(item.id);
                                setFormData({
                                  name: item.name,
                                  description: item.description || "",
                                  allocationType: item.allocationType,
                                  allocationValue: item.allocationValue || 0,
                                  employeeShareType: item.employeeShareType,
                                  employeeShareValue:
                                    item.employeeShareValue || 0,
                                  employerShareType: item.employerShareType,
                                  employerShareValue:
                                    item.employerShareValue || 0,
                                });
                                setShowForm(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete("lists", "benefits") && (
                            <ConfirmDialog
                              title="Delete Benefit"
                              message={`Are you sure you want to delete "${item.name}"? This action cannot be undone.`}
                              onConfirm={() => handleDelete(item.id)}
                            >
                              {(open) => (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={open}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </ConfirmDialog>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
