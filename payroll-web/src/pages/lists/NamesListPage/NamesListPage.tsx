import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Download, Plus, Upload } from "lucide-react";
import { useTableSort } from "@/hooks/useTableSort";
import type {
  EmployeeArea,
  EmployeeGroup,
  EmployeePosition,
  EmployeeStatus,
} from "@/types/employee";

import type { CsvPreviewRow, NameRecord } from "./NamesListPage.types";
import { BulkEditCard } from "./BulkEditCard";
import { CsvImportCard } from "./CsvImportCard";
import { NameForm } from "./NameForm";
import { NamesTable } from "./NamesTable";
import { SelectionToolbar } from "./SelectionToolbar";

export function NamesListPage() {
  const { canView, canAdd } = usePermissions();
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
    const init = async () => {
      await fetchNames();
      await fetchLookups();
    };
    init();
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
        lines[0]?.toLowerCase().includes("first") ||
        lines[0]?.toLowerCase().includes("name")
          ? 1
          : 0;

      const existingNames = new Set(
        names.map(
          (n) => `${n.firstName.toLowerCase()} ${n.lastName.toLowerCase()}`,
        ),
      );

      const preview: CsvPreviewRow[] = [];
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i]?.trim();
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
            lastName = parts[0]!.trim();
            const nameParts = parts[1]!.trim().split(" ");
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

  const handleEdit = (n: NameRecord) => {
    setEditingId(n.id);
    setFormData({
      firstName: n.firstName,
      middleName: n.middleName || "",
      lastName: n.lastName,
      suffix: n.suffix || "",
    });
    setShowForm(true);
  };

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

      <SelectionToolbar
        selectedCount={selectedCount}
        onBulkEdit={() => setShowBulkEdit(true)}
        onBulkDelete={handleBulkDelete}
        onClear={clearSelection}
      />

      {showImport && (
        <CsvImportCard
          csvPreview={csvPreview}
          csvFileName={csvFileName}
          importStats={importStats}
          importing={importing}
          onFileSelect={handleFileSelect}
          onImport={handleImport}
          onReset={resetImport}
        />
      )}

      {showForm && (
        <NameForm
          editingId={editingId}
          formData={formData}
          onUpdate={setFormData}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        />
      )}

      {showBulkEdit && (
        <BulkEditCard
          selectedCount={selectedCount}
          groups={groups}
          positions={positions}
          areas={areas}
          statuses={statuses}
          bulkEditData={bulkEditData}
          bulkLoading={bulkLoading}
          onUpdate={(field, value) =>
            setBulkEditData((prev) => ({ ...prev, [field]: value }))
          }
          onApply={handleBulkEdit}
          onCancel={() => setShowBulkEdit(false)}
        />
      )}

      <div>
        <NamesTable
          names={sortedNames}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedIds={selectedIds}
          sortConfig={sortConfig}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onSort={(key: string) => handleSort(key as keyof (NameRecord & { fullName: string }))}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
