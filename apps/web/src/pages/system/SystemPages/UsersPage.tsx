import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { Button } from "@/components/ui/Button";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/useToast";
import { useTableSort } from "@/hooks/useTableSort";
import { Plus, Upload } from "lucide-react";
import type { Department, Section, UserAccount, UserRestriction } from "@/types";
import { BulkActionBar } from "./BulkActionBar";
import { UserForm } from "./UserForm";
import { UserImportCard } from "./UserImportCard";
import { UserPermissionsCard } from "./UserPermissionsCard";
import { UsersTable } from "./UsersTable";
import type { CsvPreviewRow } from "./UserImportCard";

interface UserWithRestrictions extends UserAccount {
  restrictions?: UserRestriction[];
  role?: string;
}

export function UsersPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions();
  const { addToast } = useToast();
  const [users, setUsers] = useState<UserWithRestrictions[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    displayName: "",
    password: "",
  });
  const [editingRestrictions, setEditingRestrictions] = useState<string | null>(
    null,
  );
  const [restrictions, setRestrictions] = useState<UserRestriction[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
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

  const fetchUsers = async () => {
    setLoading(true);
    const [usersSnap, restrictionsSnap] = await Promise.all([
      getDocs(collection(db, "user_accounts")),
      getDocs(collection(db, "user_accounts_restrictions")),
    ]);
    const usersList = usersSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as UserAccount[];
    const restrictionsList = restrictionsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as UserRestriction[];
    const usersWithRestrictions = usersList.map((u) => ({
      ...u,
      restrictions: restrictionsList.filter((r) => r.userId === u.id),
    }));
    setUsers(usersWithRestrictions);
    setLoading(false);
  };

  useEffect(() => {
     
    fetchUsers();
     
  }, []);

  const filteredUsers = useMemo(() => {
    if (searchQuery === "") return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.displayName || "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.role || "").toLowerCase().includes(q),
    );
  }, [users, searchQuery]);

  const {
    items: sortedUsers,
    handleSort,
    sortConfig,
  } = useTableSort(filteredUsers, "username");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      username: formData.username,
      email: formData.email,
      displayName: formData.displayName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (editingId) {
      await updateDoc(doc(db, "user_accounts", editingId), data);
    } else {
      await addDoc(collection(db, "user_accounts"), data);
    }

    setShowForm(false);
    setEditingId(null);
    setFormData({ username: "", email: "", displayName: "", password: "" });
    fetchUsers();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this user?")) {
      await deleteDoc(doc(db, "user_accounts", id));
      fetchUsers();
    }
  };

  const handleToggleStatus = async (user: UserAccount) => {
    await updateDoc(doc(db, "user_accounts", user.id), {
      isActive: !user.isActive,
    });
    fetchUsers();
  };

  const toggleRestriction = async (
    userId: string,
    department: Department,
    section: Section,
    action: string,
  ) => {
    const existing = restrictions.find(
      (r) =>
        r.userId === userId &&
        r.department === department &&
        r.section === section,
    );
    const currentAction =
      action === "view"
        ? "canView"
        : action === "add"
          ? "canAdd"
          : action === "edit"
            ? "canEdit"
            : "canDelete";

    if (existing) {
      const updated = {
        ...existing,
        [currentAction]: !existing[currentAction as keyof UserRestriction],
      };
      await updateDoc(
        doc(db, "user_accounts_restrictions", existing.id),
        updated,
      );
    } else {
      await addDoc(collection(db, "user_accounts_restrictions"), {
        userId,
        department,
        section,
        canView: action === "view",
        canAdd: action === "add",
        canEdit: action === "edit",
        canDelete: action === "delete",
      });
    }
    fetchUsers();
  };

  const startEditRestrictions = async (userId: string) => {
    setEditingRestrictions(userId);
    const snap = await getDocs(
      query(
        collection(db, "user_accounts_restrictions"),
        where("userId", "==", userId),
      ),
    );
    setRestrictions(
      snap.docs.map((d) => ({ id: d.id, ...d.data() })) as UserRestriction[],
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === sortedUsers.length
        ? new Set()
        : new Set(sortedUsers.map((u) => u.id)),
    );
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setImportStats(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());

      const startIndex = lines[0]?.toLowerCase().includes("email") ? 1 : 0;

      const existingEmails = new Set(users.map((u) => u.email.toLowerCase()));

      const validRoles = ["admin", "manager", "user"];
      const validDepartments = [
        "payroll",
        "employees",
        "lists",
        "reports",
        "system",
      ];
      const validSections = [
        "payroll",
        "templates",
        "employees",
        "calendar",
        "groups",
        "positions",
        "areas",
        "names",
        "benefits",
        "earnings",
        "deductions",
        "13month",
        "companies",
        "terms",
        "users",
        "audit",
        "database",
      ];

      const preview: CsvPreviewRow[] = [];
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i]?.trim();
        if (!line) continue;

        const columns = line.split(",").map((c) => c.trim());

        let email = "",
          firstName = "",
          lastName = "",
          role = "user",
          department = "",
          section = "";
        let isValid = true;
        let error = "";

        if (columns.length >= 3) {
          email = columns[0] || "";
          firstName = columns[1] || "";
          lastName = columns[2] || "";
          if (columns.length >= 4) role = columns[3] || "user";
          if (columns.length >= 5) department = columns[4] || "";
          if (columns.length >= 6) section = columns[5] || "";

          if (!email || !firstName || !lastName) {
            isValid = false;
            error = "Email, firstName, and lastName required";
          } else if (!email.includes("@")) {
            isValid = false;
            error = "Invalid email format";
          } else if (existingEmails.has(email.toLowerCase())) {
            isValid = false;
            error = "Duplicate email";
          } else if (role && !validRoles.includes(role.toLowerCase())) {
            isValid = false;
            error = "Invalid role (must be admin, manager, or user)";
          } else if (
            department &&
            !validDepartments.includes(department.toLowerCase() as Department)
          ) {
            isValid = false;
            error = "Invalid department";
          } else if (
            section &&
            !validSections.includes(section.toLowerCase() as Section)
          ) {
            isValid = false;
            error = "Invalid section";
          }
        } else {
          isValid = false;
          error = "Invalid format (need at least email, firstName, lastName)";
        }

        preview.push({
          email,
          firstName,
          lastName,
          role: role || "user",
          department,
          section,
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

    const existingEmails = new Set(users.map((u) => u.email.toLowerCase()));

    for (const row of validRows) {
      const emailLower = row.email.toLowerCase();
      if (existingEmails.has(emailLower)) {
        duplicates++;
        continue;
      }
      try {
        await addDoc(collection(db, "user_accounts"), {
          email: row.email,
          username: row.email.split("@")[0],
          displayName: `${row.firstName} ${row.lastName}`,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: row.role || "user",
          department: row.department || "",
          section: row.section || "",
        });
        existingEmails.add(emailLower);
        success++;
      } catch {
        failed++;
      }
    }

    setImportStats({ success, failed, duplicates });
    setImporting(false);
    fetchUsers();
  };

  const resetImport = () => {
    setShowImport(false);
    setCsvPreview([]);
    setCsvFileName("");
    setImportStats(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    setBulkLoading(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => {
        batch.update(doc(db, "user_accounts", id), {
          isActive,
          updatedAt: new Date(),
        });
      });
      await batch.commit();
      addToast({
        type: "success",
        title: `${isActive ? "Activated" : "Deactivated"} ${selectedIds.size} user(s)`,
      });
      clearSelection();
      fetchUsers();
    } catch {
      addToast({ type: "error", title: "Bulk status update failed" });
    }
    setBulkLoading(false);
  };

  const handleBulkDelete = async () => {
    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => batch.delete(doc(db, "user_accounts", id)));
      await batch.commit();
      addToast({
        type: "success",
        title: `Deleted ${selectedIds.size} user(s)`,
      });
      clearSelection();
      fetchUsers();
    } catch {
      addToast({ type: "error", title: "Bulk delete failed" });
    }
  };

  if (!canView("system", "users"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Accounts</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          {canAdd("system", "users") && (
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          )}
        </div>
      </div>

      <BulkActionBar
        selectedCount={selectedCount}
        bulkLoading={bulkLoading}
        canEdit={canEdit}
        canDelete={canDelete}
        onActivate={() => handleBulkStatusUpdate(true)}
        onDeactivate={() => handleBulkStatusUpdate(false)}
        onDelete={handleBulkDelete}
        onClearSelection={clearSelection}
      />

      {showForm && (
        <UserForm
          editingId={editingId}
          formData={formData}
          onChange={setFormData}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        />
      )}

      {showImport && (
        <UserImportCard
          csvPreview={csvPreview}
          csvFileName={csvFileName}
          importStats={importStats}
          importing={importing}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileSelect}
          onImport={handleImport}
          onReset={resetImport}
        />
      )}

      {editingRestrictions && (
        <UserPermissionsCard
          editingRestrictions={editingRestrictions}
          restrictions={restrictions}
          onToggleRestriction={toggleRestriction}
          onClose={() => {
            setEditingRestrictions(null);
            setRestrictions([]);
            fetchUsers();
          }}
        />
      )}

      <UsersTable
        sortedUsers={sortedUsers}
        searchQuery={searchQuery}
        loading={loading}
        selectedIds={selectedIds}
        sortConfig={sortConfig}
        canEdit={canEdit}
        canDelete={canDelete}
        onSearchChange={setSearchQuery}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onSort={handleSort}
        onEditRestrictions={startEditRestrictions}
        onToggleStatus={handleToggleStatus}
        onEdit={(user) => {
          setEditingId(user.id);
          setFormData({
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            password: "",
          });
          setShowForm(true);
        }}
        onDelete={handleDelete}
      />
    </div>
  );
}
