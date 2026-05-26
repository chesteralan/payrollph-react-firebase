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
  earningExportColumns,
} from "@/utils/exportUtils";
import type { EarningItem } from "./ListPages.types";

export function EarningsPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions();
  const [items, setItems] = useState<EarningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    formulaType: "fixed" as
      | "fixed"
      | "percentage"
      | "per_hour"
      | "per_day"
      | "custom",
    formulaValue: 0,
    formulaExpression: "",
  });

  const fetchItems = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "earnings"));
    setItems(
      snap.docs.map((d) => ({ id: d.id, ...d.data() })) as EarningItem[],
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
      formulaType: formData.formulaType,
      formulaValue: ["percentage", "per_hour", "per_day"].includes(
        formData.formulaType,
      )
        ? formData.formulaValue
        : undefined,
      formulaExpression:
        formData.formulaType === "custom"
          ? formData.formulaExpression
          : undefined,
      isActive: true,
    };
    if (editingId) {
      await updateDoc(doc(db, "earnings", editingId), data);
    } else {
      await addDoc(collection(db, "earnings"), data);
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      formulaType: "fixed",
      formulaValue: 0,
      formulaExpression: "",
    });
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "earnings", id));
    fetchItems();
  };

  const handleToggleStatus = async (item: EarningItem) => {
    await updateDoc(doc(db, "earnings", item.id), { isActive: !item.isActive });
    fetchItems();
  };

  const getFormulaBadge = (item: EarningItem) => {
    switch (item.formulaType) {
      case "fixed":
        return { label: "Fixed", color: "bg-gray-100 text-gray-800" };
      case "percentage":
        return {
          label: `${item.formulaValue}%`,
          color: "bg-blue-100 text-blue-800",
        };
      case "per_hour":
        return {
          label: `${item.formulaValue}/hr`,
          color: "bg-green-100 text-green-800",
        };
      case "per_day":
        return {
          label: `${item.formulaValue}/day`,
          color: "bg-yellow-100 text-yellow-800",
        };
      case "custom":
        return { label: "Custom", color: "bg-purple-100 text-purple-800" };
      default:
        return { label: "Unknown", color: "bg-gray-100 text-gray-800" };
    }
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
      formulaType: item.formulaType,
      formulaValue: item.formulaValue || 0,
      isActive: item.isActive,
    }));
    exportToXLS(data, {
      filename: "Earnings",
      columns: earningExportColumns,
      sheetName: "Earnings",
    });
  };

  const handleExportCSV = () => {
    const data = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || "",
      formulaType: item.formulaType,
      isActive: item.isActive,
    }));
    exportToCSV(data, earningExportColumns, "Earnings");
  };

  if (!canView("lists", "earnings"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportXLS}>
            <Download className="w-4 h-4 mr-2" />
            XLS
          </Button>
          {canAdd("lists", "earnings") && (
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Earning
            </Button>
          )}
        </div>
      </div>
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit" : "Add"} Earning</CardTitle>
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
                    Formula Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={formData.formulaType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        formulaType: e.target
                          .value as EarningItem["formulaType"],
                      })
                    }
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                    <option value="per_hour">Per Hour</option>
                    <option value="per_day">Per Day</option>
                    <option value="custom">Custom Expression</option>
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
                {["percentage", "per_hour", "per_day"].includes(
                  formData.formulaType,
                ) && (
                  <Input
                    id="formulaValue"
                    label={
                      formData.formulaType === "percentage"
                        ? "Percentage (%)"
                        : formData.formulaType === "per_hour"
                          ? "Amount per Hour"
                          : "Amount per Day"
                    }
                    type="number"
                    value={String(formData.formulaValue)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        formulaValue: Number(e.target.value),
                      })
                    }
                  />
                )}
                {formData.formulaType === "custom" && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Formula Expression
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      rows={3}
                      value={formData.formulaExpression}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          formulaExpression: e.target.value,
                        })
                      }
                      placeholder="Enter custom formula expression"
                    />
                  </div>
                )}
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
                  Formula
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
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : sortedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No earnings found
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => {
                  const badge = getFormulaBadge(item);
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
                          {canEdit("lists", "earnings") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingId(item.id);
                                setFormData({
                                  name: item.name,
                                  description: item.description || "",
                                  formulaType: item.formulaType,
                                  formulaValue: item.formulaValue || 0,
                                  formulaExpression:
                                    item.formulaExpression || "",
                                });
                                setShowForm(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete("lists", "earnings") && (
                            <ConfirmDialog
                              title="Delete Earning"
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
