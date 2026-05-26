import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePermissions } from "@/hooks/usePermissions";
import { useTableSort } from "@/hooks/useTableSort";
import {
  Plus,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import type { Term } from "../../types";

const typeLabels: Record<string, string> = {
  "semi-monthly": "Semi-monthly",
  monthly: "Monthly",
  "bi-weekly": "Bi-weekly",
  weekly: "Weekly",
};

export function TermsPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions();
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "semi-monthly" as Term["type"],
    frequency: "",
    daysPerPeriod: 0,
    cutOff1: 0,
    cutOff2: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);

  const fetchTerms = async () => {
    setLoading(true);
    const snap = await getDocs(
      query(collection(db, "payroll_terms"), orderBy("name")),
    );
    setTerms(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Term[]);
    setLoading(false);
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    fetchTerms();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const newWarnings: string[] = [];

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else {
      const duplicate = terms.find(
        (t) =>
          t.name.toLowerCase() === formData.name.trim().toLowerCase() &&
          t.id !== editingId,
      );
      if (duplicate) newErrors.name = "Term name must be unique";
    }

    if (formData.daysPerPeriod <= 0 || formData.daysPerPeriod > 31) {
      newErrors.daysPerPeriod = "Days per period must be between 1 and 31";
    }

    if (
      formData.type === "monthly" &&
      (formData.daysPerPeriod < 28 || formData.daysPerPeriod > 31)
    ) {
      newErrors.daysPerPeriod = "Monthly terms should have 28-31 days";
    }

    if (formData.type === "semi-monthly") {
      if (!formData.cutOff1 || formData.cutOff1 < 1 || formData.cutOff1 > 31) {
        newErrors.cutOff1 = "First cutoff day is required (1-31)";
      }
      if (!formData.cutOff2 || formData.cutOff2 < 1 || formData.cutOff2 > 31) {
        newErrors.cutOff2 = "Second cutoff day is required (1-31)";
      }
    }

    if (
      (formData.type === "weekly" || formData.type === "bi-weekly") &&
      !formData.frequency.trim()
    ) {
      newErrors.frequency = "Frequency is required for weekly/bi-weekly terms";
    }

    const sameTypeFreq = terms.find(
      (t) =>
        t.type === formData.type &&
        t.frequency === formData.frequency &&
        t.id !== editingId,
    );
    if (sameTypeFreq) {
      newWarnings.push(
        `A term with same type and frequency already exists: ${sameTypeFreq.name}`,
      );
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
    if (showForm) validateForm();
    /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  }, [formData, showForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data: Record<string, unknown> = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      type: formData.type,
      frequency: formData.frequency.trim(),
      daysPerPeriod: formData.daysPerPeriod,
      isActive: true,
    };

    if (formData.type === "semi-monthly") {
      data.cutOff1 = formData.cutOff1;
      data.cutOff2 = formData.cutOff2;
    }

    if (editingId) {
      await updateDoc(doc(db, "payroll_terms", editingId), {
        ...data,
        updatedAt: new Date(),
      });
    } else {
      await addDoc(collection(db, "payroll_terms"), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      type: "semi-monthly",
      frequency: "",
      daysPerPeriod: 0,
      cutOff1: 0,
      cutOff2: 0,
    });
    setErrors({});
    setWarnings([]);
    fetchTerms();
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "payroll_terms", id));
    setConfirmDelete(null);
    fetchTerms();
  };

  const handleToggleStatus = async (term: Term) => {
    await updateDoc(doc(db, "payroll_terms", term.id), {
      isActive: !term.isActive,
      updatedAt: new Date(),
    });
    fetchTerms();
  };

  const {
    items: sortedTerms,
    handleSort,
    sortConfig,
  } = useTableSort(terms, "name");

  if (!canView("system", "terms"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Terms</h1>
        {canAdd("system", "terms") && (
          <Button
            onClick={() => {
              setEditingId(null);
              setFormData({
                name: "",
                description: "",
                type: "semi-monthly",
                frequency: "",
                daysPerPeriod: 0,
              });
              setShowForm(!showForm);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Term
          </Button>
        )}
      </div>
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit" : "Add"} Term</CardTitle>
          </CardHeader>
          <CardContent>
            {warnings.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                {warnings.map((w, i) => (
                  <p key={i} className="text-sm text-yellow-800">
                    {w}
                  </p>
                ))}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    id="name"
                    label="Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as Term["type"],
                      })
                    }
                  >
                    <option value="semi-monthly">Semi-monthly</option>
                    <option value="monthly">Monthly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <Input
                    id="frequency"
                    label="Frequency"
                    value={formData.frequency}
                    onChange={(e) =>
                      setFormData({ ...formData, frequency: e.target.value })
                    }
                  />
                  {errors.frequency && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.frequency}
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    id="daysPerPeriod"
                    label="Days per Period"
                    type="number"
                    value={String(formData.daysPerPeriod)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        daysPerPeriod: Number(e.target.value),
                      })
                    }
                  />
                  {errors.daysPerPeriod && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.daysPerPeriod}
                    </p>
                  )}
                </div>
                {formData.type === "semi-monthly" && (
                  <>
                    <div>
                      <Input
                        id="cutOff1"
                        label="First Cutoff Day"
                        type="number"
                        value={String(formData.cutOff1)}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cutOff1: Number(e.target.value),
                          })
                        }
                      />
                      {errors.cutOff1 && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.cutOff1}
                        </p>
                      )}
                    </div>
                    <div>
                      <Input
                        id="cutOff2"
                        label="Second Cutoff Day"
                        type="number"
                        value={String(formData.cutOff2)}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cutOff2: Number(e.target.value),
                          })
                        }
                      />
                      {errors.cutOff2 && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.cutOff2}
                        </p>
                      )}
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <Input
                    id="description"
                    label="Description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={Object.keys(errors).length > 0}>
                  {editingId ? "Update" : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setErrors({});
                    setWarnings([]);
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
                  Type
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Frequency
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Days/Period
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
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : sortedTerms.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No terms found
                  </td>
                </tr>
              ) : (
                sortedTerms.map((term) => (
                  <tr key={term.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {term.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {typeLabels[term.type] || term.type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {term.frequency || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {term.daysPerPeriod || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(term)}
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full transition-colors ${term.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {term.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit("system", "terms") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(term.id);
                              setFormData({
                                name: term.name,
                                description: term.description || "",
                                type: term.type,
                                frequency: term.frequency,
                                daysPerPeriod: term.daysPerPeriod,
                                cutOff1: term.cutOff1 || 0,
                                cutOff2: term.cutOff2 || 0,
                              });
                              setShowForm(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete("system", "terms") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDelete(term.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Term"
          message="Delete this term? This cannot be undone."
          confirmText="Delete"
          onConfirm={() => handleDelete(confirmDelete)}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(null)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </ConfirmDialog>
      )}
    </div>
  );
}
