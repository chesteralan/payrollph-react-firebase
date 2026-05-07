import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { usePermissions } from "../../hooks/usePermissions";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { SearchBar } from "../../components/ui/SearchBar";
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  X,
  Check,
  AlertCircle,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  CheckSquare,
  Square,
} from "lucide-react";
import { useTableSort } from "../../hooks/useTableSort";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import type {
  EmployeeGroup,
  EmployeePosition,
  EmployeeArea,
  EmployeeStatus,
} from "../../types/employee";

interface NameRecord {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
}

interface CsvPreviewRow {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  isValid: boolean;
  error?: string;
}

export function NamesListPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions();
  const { addToast } = useToast();
  const [names, setNames] = useState<NameRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
  });
  const [showImport, setShowImport] = useState(false);
  const [csvPreview, setCsvPreview] = useState<CsvPreviewRow[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState<{
    success: number;
    failed: number;
    duplicates: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [groups, setGroups] = useState<EmployeeGroup[]>([]);
  const [positions, setPositions] = useState<EmployeePosition[]>([]);
  const [areas, setAreas] = useState<EmployeeArea[]>([]);
  const [statuses, setStatuses] = useState<EmployeeStatus[]>([]);
  const [bulkEditData, setBulkEditData] = useState({
    groupId: "",
    positionId: "",
    areaId: "",
    statusId: "",
  });

  const fetchNames = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "names"));
    const all = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as (NameRecord & { deletedAt?: Timestamp })[];
    setNames(all.filter((n) => !n.deletedAt));
    setLoading(false);
  };

  const fetchLookups = async () => {
    const [groupsSnap, positionsSnap, areasSnap, statusesSnap] =
      await Promise.all([
        getDocs(collection(db, "groups")),
        getDocs(collection(db, "positions")),
        getDocs(collection(db, "areas")),
        getDocs(collection(db, "statuses")),
      ]);
    setGroups(
      groupsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as EmployeeGroup)
        .filter((g) => g.isActive !== false),
    );
    setPositions(
      positionsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as EmployeePosition)
        .filter((p) => p.isActive !== false),
    );
    setAreas(
      areasSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as EmployeeArea)
        .filter((a) => a.isActive !== false),
    );
    setStatuses(
      statusesSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as EmployeeStatus)
        .filter((s) => s.isActive !== false),
    );
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    fetchNames();
    fetchLookups();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateDoc(doc(db, "names", editingId), formData);
    } else {
      await addDoc(collection(db, "names"), formData);
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({ firstName: "", middleName: "", lastName: "", suffix: "" });
    fetchNames();
  };

  const filteredNames = useMemo(() => {
    if (searchQuery === "") return names;
    const q = searchQuery.toLowerCase();
    return names.filter(
      (n) =>
        n.firstName.toLowerCase().includes(q) ||
        (n.middleName || "").toLowerCase().includes(q) ||
        n.lastName.toLowerCase().includes(q) ||
        (n.suffix || "").toLowerCase().includes(q),
    );
  }, [names, searchQuery]);

  const {
    items: sortedNames,
    handleSort,
    sortConfig,
  } = useTableSort(
    filteredNames.map((n) => ({
      ...n,
      fullName: `${n.firstName} ${n.middleName || ""} ${n.lastName}`,
    })),
    "lastName",
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === sortedNames.length
        ? new Set()
        : new Set(sortedNames.map((n) => n.id)),
    );
  }, [sortedNames]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleBulkEdit = async () => {
    const updates = Object.entries(bulkEditData).filter(([, v]) => v);
    if (updates.length === 0) return;

    setBulkLoading(true);
    try {
      const nameIds = Array.from(selectedIds);
      const empSnap = await getDocs(
        query(collection(db, "employees"), where("nameId", "in", nameIds)),
      );
      const batch = writeBatch(db);
      empSnap.docs.forEach((d) => {
        const data: Record<string, string> = {};
        if (bulkEditData.groupId) data.groupId = bulkEditData.groupId;
        if (bulkEditData.positionId) data.positionId = bulkEditData.positionId;
        if (bulkEditData.areaId) data.areaId = bulkEditData.areaId;
        if (bulkEditData.statusId) data.statusId = bulkEditData.statusId;
        batch.update(doc(db, "employees", d.id), {
          ...data,
          updatedAt: new Date(),
        });
      });
      await batch.commit();
      addToast({
        type: "success",
        title: `Updated ${empSnap.size} employee(s)`,
      });
      setShowBulkEdit(false);
      setBulkEditData({
        groupId: "",
        positionId: "",
        areaId: "",
        statusId: "",
      });
      clearSelection();
    } catch {
      addToast({ type: "error", title: "Bulk update failed" });
    }
    setBulkLoading(false);
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) =>
        batch.update(doc(db, "names", id), { deletedAt: serverTimestamp() }),
      );
      await batch.commit();
      addToast({
        type: "success",
        title: `Archived ${selectedIds.size} name(s)`,
      });
      clearSelection();
      fetchNames();
    } catch {
      addToast({ type: "error", title: "Bulk archive failed" });
    }
    setBulkLoading(false);
  };

  const handleDelete = async (id: string, name: string) => {
    await updateDoc(doc(db, "names", id), { deletedAt: serverTimestamp() });
    addToast({
      type: "success",
      title: "Name archived",
      message: `${name} has been moved to trash`,
    });
    fetchNames();
  };

  const handleExportCSV = () => {
    const headers = ["First Name", "Middle Name", "Last Name", "Suffix"];
    const csvRows = [headers.join(",")];
    for (const n of names) {
      csvRows.push(
        [n.firstName, n.middleName || "", n.lastName, n.suffix || ""].join(","),
      );
    }
    const csv = csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NamesList_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setImportStats(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());

      const startIndex =
        lines[0].toLowerCase().includes("first") ||
        lines[0].toLowerCase().includes("name")
          ? 1
          : 0;

      const existingNames = new Set(
        names.map(
          (n) => `${n.firstName.toLowerCase()} ${n.lastName.toLowerCase()}`,
        ),
      );

      const preview: CsvPreviewRow[] = [];
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.includes("\t")
          ? line.split("\t")
          : line.split(",").map((c) => c.trim());

        let firstName = "",
          middleName = "",
          lastName = "",
          suffix = "";
        let isValid = true;
        let error = "";

        if (columns.length >= 2) {
          firstName = columns[0] || "";
          lastName = columns[1] || "";
          if (columns.length >= 3) middleName = columns[2] || "";
          if (columns.length >= 4) suffix = columns[3] || "";

          if (!firstName || !lastName) {
            isValid = false;
            error = "First and Last name required";
          } else if (
            existingNames.has(
              `${firstName.toLowerCase()} ${lastName.toLowerCase()}`,
            )
          ) {
            isValid = false;
            error = "Duplicate name";
          }
        } else {
          const parts = line.split(",");
          if (parts.length >= 2) {
            lastName = parts[0].trim();
            const nameParts = parts[1].trim().split(" ");
            firstName = nameParts[0] || "";
            middleName = nameParts.slice(1).join(" ");
          } else {
            isValid = false;
            error = "Invalid format";
          }
        }

        preview.push({
          firstName,
          middleName,
          lastName,
          suffix,
          isValid,
          error,
        });
      }

      setCsvPreview(preview);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const validRows = csvPreview.filter((row) => row.isValid);
    if (validRows.length === 0) return;

    setImporting(true);
    let success = 0;
    let failed = 0;
    let duplicates = 0;

    const existingNames = new Set(
      names.map(
        (n) => `${n.firstName.toLowerCase()} ${n.lastName.toLowerCase()}`,
      ),
    );

    for (const row of validRows) {
      const key = `${row.firstName.toLowerCase()} ${row.lastName.toLowerCase()}`;
      if (existingNames.has(key)) {
        duplicates++;
        continue;
      }
      try {
        await addDoc(collection(db, "names"), {
          firstName: row.firstName,
          middleName: row.middleName || undefined,
          lastName: row.lastName,
          suffix: row.suffix || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        existingNames.add(key);
        success++;
      } catch {
        failed++;
      }
    }

    setImportStats({ success, failed, duplicates });
    setImporting(false);
    fetchNames();
  };

  const resetImport = () => {
    setShowImport(false);
    setCsvPreview([]);
    setCsvFileName("");
    setImportStats(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!canView("lists", "names"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Names List</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="secondary" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          {canAdd("lists", "names") && (
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Name
            </Button>
          )}
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <span className="text-sm text-blue-800">
            {selectedCount} name{selectedCount !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            {canEdit("lists", "names") && (
              <Button size="sm" onClick={() => setShowBulkEdit(true)}>
                Bulk Edit
              </Button>
            )}
            {canDelete("lists", "names") && (
              <ConfirmDialog
                title="Bulk Archive"
                message={`Archive ${selectedCount} selected name${selectedCount !== 1 ? "s" : ""}? They can be restored from Trash.`}
                confirmText="Archive All"
                variant="warning"
                onConfirm={handleBulkDelete}
              >
                {(open) => (
                  <Button size="sm" variant="danger" onClick={open}>
                    Bulk Archive
                  </Button>
                )}
              </ConfirmDialog>
            )}
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {showImport && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Import Names from CSV</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetImport}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!csvPreview.length && !importStats && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Upload a CSV file with names
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Format: firstName, lastName, middleName, suffix (or lastName,
                  firstName middleName)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select File
                </Button>
              </div>
            )}

            {csvFileName && csvPreview.length > 0 && !importStats && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600">
                    File: <span className="font-medium">{csvFileName}</span>
                    <span className="ml-2">
                      ({csvPreview.length} rows found)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm text-green-600">
                      {csvPreview.filter((r) => r.isValid).length} valid
                    </span>
                    <span className="text-sm text-red-600">
                      {csvPreview.filter((r) => !r.isValid).length} invalid
                    </span>
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2">#</th>
                        <th className="text-left px-3 py-2">First Name</th>
                        <th className="text-left px-3 py-2">Middle Name</th>
                        <th className="text-left px-3 py-2">Last Name</th>
                        <th className="text-left px-3 py-2">Suffix</th>
                        <th className="text-left px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {csvPreview.map((row, index) => (
                        <tr
                          key={index}
                          className={row.isValid ? "" : "bg-red-50"}
                        >
                          <td className="px-3 py-2 text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2">{row.firstName}</td>
                          <td className="px-3 py-2">{row.middleName}</td>
                          <td className="px-3 py-2">{row.lastName}</td>
                          <td className="px-3 py-2">{row.suffix}</td>
                          <td className="px-3 py-2">
                            {row.isValid ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <span className="flex items-center gap-1 text-red-600 text-xs">
                                <AlertCircle className="w-3 h-3" />
                                {row.error}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" onClick={resetImport}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={
                      importing ||
                      csvPreview.filter((r) => r.isValid).length === 0
                    }
                  >
                    {importing
                      ? "Importing..."
                      : `Import ${csvPreview.filter((r) => r.isValid).length} Names`}
                  </Button>
                </div>
              </div>
            )}

            {importStats && (
              <div className="text-center py-8">
                <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Import Complete</h3>
                <p className="text-gray-600 mb-4">
                  Successfully imported{" "}
                  <span className="font-medium text-green-600">
                    {importStats.success}
                  </span>{" "}
                  names
                  {importStats.failed > 0 && (
                    <span>
                      ,{" "}
                      <span className="font-medium text-red-600">
                        {importStats.failed}
                      </span>{" "}
                      failed
                    </span>
                  )}
                  {importStats.duplicates > 0 && (
                    <span>
                      ,{" "}
                      <span className="font-medium text-yellow-600">
                        {importStats.duplicates}
                      </span>{" "}
                      duplicates skipped
                    </span>
                  )}
                </p>
                <Button onClick={resetImport}>Done</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit" : "Add"} Name</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="firstName"
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
                <Input
                  id="middleName"
                  label="Middle Name"
                  value={formData.middleName}
                  onChange={(e) =>
                    setFormData({ ...formData, middleName: e.target.value })
                  }
                />
                <Input
                  id="lastName"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
                <Input
                  id="suffix"
                  label="Suffix"
                  value={formData.suffix}
                  onChange={(e) =>
                    setFormData({ ...formData, suffix: e.target.value })
                  }
                />
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

      {showBulkEdit && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Bulk Edit {selectedCount} Name{selectedCount !== 1 ? "s" : ""}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBulkEdit(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group
                </label>
                <select
                  value={bulkEditData.groupId}
                  onChange={(e) =>
                    setBulkEditData({
                      ...bulkEditData,
                      groupId: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">-- No Change --</option>
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
                  value={bulkEditData.positionId}
                  onChange={(e) =>
                    setBulkEditData({
                      ...bulkEditData,
                      positionId: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">-- No Change --</option>
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
                  value={bulkEditData.areaId}
                  onChange={(e) =>
                    setBulkEditData({ ...bulkEditData, areaId: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">-- No Change --</option>
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
                <select
                  value={bulkEditData.statusId}
                  onChange={(e) =>
                    setBulkEditData({
                      ...bulkEditData,
                      statusId: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">-- No Change --</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setShowBulkEdit(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkEdit}
                disabled={
                  bulkLoading || !Object.values(bulkEditData).some((v) => v)
                }
              >
                {bulkLoading ? "Updating..." : "Apply Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center gap-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search names..."
            />
            <span className="text-sm text-gray-500 ml-auto">
              {sortedNames.length} name{sortedNames.length !== 1 ? "s" : ""}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">
                  <button
                    onClick={toggleSelectAll}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {selectedIds.size === sortedNames.length &&
                    sortedNames.length > 0 ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th
                  className="text-left px-2 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort("fullName")}
                >
                  <div className="flex items-center gap-1">
                    Name
                    {sortConfig?.key === "fullName" ? (
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
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : sortedNames.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No names found
                  </td>
                </tr>
              ) : (
                sortedNames.map((n) => (
                  <tr
                    key={n.id}
                    className={
                      selectedIds.has(n.id) ? "bg-blue-50" : "hover:bg-gray-50"
                    }
                  >
                    <td className="px-4">
                      <button
                        onClick={() => toggleSelect(n.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {selectedIds.has(n.id) ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-2 py-4 text-sm text-gray-900">
                      {n.firstName} {n.middleName || ""} {n.lastName}
                      {n.suffix ? `, ${n.suffix}` : ""}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit("lists", "names") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(n.id);
                              setFormData({
                                firstName: n.firstName,
                                middleName: n.middleName || "",
                                lastName: n.lastName,
                                suffix: n.suffix || "",
                              });
                              setShowForm(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete("lists", "names") && (
                          <ConfirmDialog
                            title="Archive Name"
                            message={`Archive ${n.firstName} ${n.lastName}? It can be restored from Trash.`}
                            confirmText="Archive"
                            variant="danger"
                            onConfirm={() =>
                              handleDelete(n.id, `${n.firstName} ${n.lastName}`)
                            }
                          >
                            {(open) => (
                              <Button variant="ghost" size="sm" onClick={open}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </ConfirmDialog>
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
    </div>
  );
}
